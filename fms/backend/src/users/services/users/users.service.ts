import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import {
  Brackets,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  ForgetPasswordDto,
  ResetPasswordDto,
  UserSignInDto,
} from '../../dto/login-user.dto';
import { AuthService } from 'src/auth/auth.service';
import * as moment from 'moment-timezone';
import { HashService } from 'src/encryption/services/hash/hash.service';
import { EmailService } from 'src/email/email.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { RolesService } from 'src/roles/services/roles/roles.service';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { SortOptions } from 'src/common/classes/Sorting';
import { UserSortKeys } from 'src/users/dto/user.dto';
import { ExportService } from 'src/export/export.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly hashService: HashService,
    private readonly emailService: EmailService,
    private readonly rolesService: RolesService,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<UserSortKeys> = {
      sortKey: UserSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const users = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(users);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<User>,
    search: string,
  ) {
    if (search) {
      const searchTerms = search.trim().replace(/\s+/g, ' ').split(' '); // removing extra white spaces
      const ilikeConditions = [];
      const parameters = {};

      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `roles.roleName ILIKE :${paramName} OR user.name ILIKE :${paramName} OR user.email ILIKE :${paramName} OR user.phoneNumber ILIKE :${paramName}`,
        );
        parameters[paramName] = `%${term}%`;
      });

      query = query.andWhere(
        new Brackets((qb) =>
          qb.andWhere(ilikeConditions.join(' OR '), parameters),
        ),
      );
    }

    return query;
  }

  private applySortingQueryForFindAll(
    query: SelectQueryBuilder<User>,
    sortOptions: SortOptions<UserSortKeys>,
  ) {
    if (sortOptions.sortKey === UserSortKeys.assignedRole) {
      query = query.orderBy(`roles.roleName`, sortOptions.sortOrder);
    } else {
      query = query.orderBy(
        `user.${sortOptions.sortKey}`,
        sortOptions.sortOrder,
      );
    }

    return query;
  }

  private mapDataForFindAll(data: Pagination<User>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const user = {
        id: e.id,
        email: e.email,
        phoneNumber: e.phoneNumber,
        name: e.name,
        assignedRole: e.roles.find((r) => r).roleName,
      };
      return user;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<User>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const user = await this.usersRepository.findOne({
      where: options,
      relations,
    });

    if (!user && throwException) {
      throw new NotFoundException(`No such User found!`);
    }

    return user;
  }

  async signIn(userSignInDto: UserSignInDto) {
    const user = await this.findOne({ email: userSignInDto.email });

    // console.log(await this.hashService.hashPassword(userSignInDto.password))

    const userPasswordHash: string = user.password;

    const passwordVerification = await this.hashService.comparePassword(
      userSignInDto.password,
      userPasswordHash,
    );

    if (!passwordVerification) {
      throw new BadRequestException('Wrong Password');
    }

    const { access_token: accessToken } = await this.authService.generateToken(
      user.email,
      user.id,
    );

    user.lastLoginAt = moment();
    await this.usersRepository.save(user);

    return { accessToken, userId: user.id };
  }

  async forgetPassword(forgetPasswordDto: ForgetPasswordDto) {
    const user = await this.findOne({ email: forgetPasswordDto.email });

    const token = await this.authService.generatePasswordResetToken(
      user.email,
      user.id,
    );
    user.passwordResetToken = token.access_token;

    await this.usersRepository.save(user);

    // TODO Setup email module and send passwordReset link
    const passwordResetLink = ``;

    await this.emailService.sendResetPasswordEmail(user.email, {
      resetPasswordLink: passwordResetLink,
    });

    return { passwordResetLink };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.findOne({ id: resetPasswordDto.id });

    if (!user.passwordResetToken) {
      throw new NotFoundException('Password Reset Token Not Found');
    }

    if (!(user.passwordResetToken === resetPasswordDto.passwordResetToken)) {
      throw new BadRequestException('Wrong Password Reset Token');
    }

    try {
      await this.authService.verityPasswordResetTokenExpiry(
        resetPasswordDto.passwordResetToken,
      );
    } catch (err) {
      throw new BadRequestException('Password Reset Token Expired');
    }

    const samePasswordCheck = await this.hashService.comparePassword(
      resetPasswordDto.password,
      user.password,
    );

    if (samePasswordCheck) {
      throw new BadRequestException(
        'New password cannot be same as old password',
      );
    }

    user.password = await this.hashService.hashPassword(
      resetPasswordDto.password,
    );
    user.passwordResetToken = null;

    return await this.usersRepository.save(user);
  }

  async create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);

    const role = await this.rolesService.findOne({
      roleName: createUserDto.assignedRole,
    });

    user.password = await this.hashService.hashPassword(createUserDto.password);
    user.roles = [role];

    const savedUser = await this.usersRepository.save(user);

    await this.rolesService.incrementAssignedUserCount(role);

    return savedUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    let user = await this.findOne({ id });

    user = { ...user, ...updateUserDto };

    if (updateUserDto.assignedRole) {
      const role = await this.rolesService.findOne({
        roleName: updateUserDto.assignedRole,
      });
      user.roles = [role];
    }

    if (updateUserDto.password) {
      user.password = await this.hashService.hashPassword(
        updateUserDto.password,
      );
    }

    return await this.usersRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne({ id });

    user.deletedAt = moment.tz();
    user.isDeleted = true;

    return await this.usersRepository.save(user);
  }

  private mapDataForExport(data: User[]) {
    const returnData = data.map((e) => {
      const user = {
        id: e.id,
        email: e.email,
        phoneNumber: e.phoneNumber,
        name: e.name,
        assignedRole: e.roles.find((r) => r).roleName,
      };
      return user;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<UserSortKeys> = {
      sortKey: UserSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const users = await query.getMany();
    const mappedUsers = this.mapDataForExport(users);

    return mappedUsers;
  }

  async copyPrint(
    sortOptions: SortOptions<UserSortKeys> = {
      sortKey: UserSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const users = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Users\n\nUser\tEmail\tPhone Number\tAssigned Role\n`;

    const data = users
      .map((e) => {
        const email = e.email || '-';
        const phoneNumber = e.phoneNumber || '-';
        const user = e.name || '-';
        const assignedRole = e.assignedRole || '-';

        return `${user}\t${email}\t${phoneNumber}\t${assignedRole}`;
      })
      .join('\n');

    const exportData = `${header}${data}`;
    const rowCount = users.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<UserSortKeys> = {
      sortKey: UserSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const users = await this.getDataForExport(sortOptions, search);

    const mappedUsers = users.map((e) => {
      const obj = {
        User: e.name,
        Email: e.email,
        'Phone Number': e.phoneNumber,
        'Assigned Role': e.assignedRole,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedUsers);
  }

  async generateExcelFile(
    sortOptions: SortOptions<UserSortKeys> = {
      sortKey: UserSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const users = await this.getDataForExport(sortOptions, search);

    const mappedUsers = users.map((e) => {
      const obj = {
        User: e.name,
        Email: e.email,
        'Phone Number': e.phoneNumber,
        'Assigned Role': e.assignedRole,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedUsers, 'User');
  }

  async generatePdf(
    sortOptions: SortOptions<UserSortKeys> = {
      sortKey: UserSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const users = await this.getDataForExport(sortOptions, search);

    const mappedUsers = users.map((e) => {
      const obj = {
        User: e.name,
        Email: e.email,
        'Phone Number': e.phoneNumber,
        'Assigned Role': e.assignedRole,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedUsers,
      'Smart Fleet SaaS - User',
    );
  }
}
