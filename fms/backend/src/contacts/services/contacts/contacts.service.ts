import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment-timezone';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { dateResMomentFormat } from 'src/common/utilities/formats';
import {
  CreateContactDto,
  UpdateContactDto,
} from 'src/contacts/dto/contact.dto';
import { Contact } from 'src/contacts/entities/contact.entity';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    relations: string[] = [],
  ) {
    const contacts = await paginate(
      this.contactsRepository,
      paginationOptions,
      {
        where: {
          isDeleted: false,
        },
        relations,
      },
    );

    return this.mapDataForFindAll(contacts);
  }

  private mapDataForFindAll(data: Pagination<Contact>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const contact = {
        id: e.id,
        email: e.email,
        name: e.name,
        message: e.message,
        subject: e.subject,
        contactNumber: e.contactNumber,
        createdAt: moment(e.createdAt).format(dateResMomentFormat),
      };
      return contact;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<Contact>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const contact = await this.contactsRepository.findOne({
      where: options,
      relations,
    });

    if (!contact && throwException) {
      throw new NotFoundException(`No such Contact found!`);
    }

    return contact;
  }

  async create(createContactDto: CreateContactDto) {
    const contact = this.contactsRepository.create(createContactDto);

    return await this.contactsRepository.save(contact);
  }

  async update(id: string, updateContactDto: UpdateContactDto) {
    let contact: any = await this.findOne({ id });

    contact = { ...contact, ...updateContactDto };

    return await this.contactsRepository.save(contact);
  }

  async remove(id: string) {
    const contact = await this.findOne({ id });

    contact.deletedAt = moment.tz();
    contact.isDeleted = true;

    return await this.contactsRepository.save(contact);
  }
}
