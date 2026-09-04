import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  ForgetPasswordDto,
  ResetPasswordDto,
  UserSignInDto,
} from '../../dto/login-user.dto';
import { AuthService } from 'src/auth/auth.service';
import * as moment from 'moment-timezone';
import { HashService } from 'src/encryption/services/hash/hash.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly hashService: HashService,
    private readonly emailService: EmailService,
  ) {}

  async findOne(
    options: FindOptionsWhere<User>,
    throwException: boolean = true,
    relations: string[] = [],
  ) {
    const whereOptions: FindOptionsWhere<User> = {
      ...options,
    };

    const user = await this.usersRepository.findOne({
      where: whereOptions,
      relations,
    });

    if (!user && throwException) {
      throw new NotFoundException(`No such User found!`);
    }

    return user;
  }

  async signIn(userSignInDto: UserSignInDto) {
    const user = await this.findOne({ email: userSignInDto.email });

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
}
