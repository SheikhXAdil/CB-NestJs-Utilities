import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '../../entities/client.entity';
import {
  Brackets,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import * as moment from 'moment-timezone';
import { CreateClientDto } from 'src/clients/dto/create-client.dto';
import { UpdateClientDto } from 'src/clients/dto/update-client.dto';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { ClientSortKeys } from 'src/clients/dto/client.dto';
import { SortOptions } from 'src/common/classes/Sorting';
import { ExportService } from 'src/export/export.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<ClientSortKeys> = {
      sortKey: ClientSortKeys.clientId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.clientsRepository
      .createQueryBuilder('client')
      .where('client.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const clients = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(clients);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<Client>,
    search: string,
  ) {
    if (search) {
      const searchTerms = search.trim().replace(/\s+/g, ' ').split(' '); // removing extra white spaces
      const ilikeConditions = [];
      const parameters = {};

      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `client.phoneNumber ILIKE :${paramName} OR client.name ILIKE :${paramName} OR client.email ILIKE :${paramName} OR client.address ILIKE :${paramName}`,
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
    query: SelectQueryBuilder<Client>,
    sortOptions: SortOptions<ClientSortKeys>,
  ) {
    query = query.orderBy(
      `client.${sortOptions.sortKey}`,
      sortOptions.sortOrder,
    );
    return query;
  }

  private mapDataForFindAll(data: Pagination<Client>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const client = {
        id: e.id,
        clientId: e.clientId,
        email: e.email,
        phoneNumber: e.phoneNumber,
        name: e.name,
        address: e.address,
      };
      return client;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<Client>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const client = await this.clientsRepository.findOne({
      where: options,
      relations,
    });

    if (!client && throwException) {
      throw new NotFoundException(`Client not found!`);
    }

    return client;
  }

  async createClient(createClientDto: CreateClientDto) {
    const client = this.clientsRepository.create(createClientDto);

    client.clientId = await this.getClientId();

    // Removed the password-related logic
    return await this.clientsRepository.save(client);
  }

  async updateClient(id: string, updateClientDto: UpdateClientDto) {
    let client = await this.findOne({ id });

    client = { ...client, ...updateClientDto };

    //Removed the password-related logic

    return await this.clientsRepository.save(client);
  }

  async deleteClient(id: string) {
    const client = await this.findOne({ id });

    client.deletedAt = moment.tz();
    client.isDeleted = true;

    return await this.clientsRepository.save(client);
  }

  private async getEntityCount() {
    const entityCount = await this.clientsRepository.count();

    return entityCount;
  }

  async getClientId() {
    const prefix = 'CLI-';

    const entityCount = await this.getEntityCount();

    const uniquePart =
      entityCount !== 0 ? String(entityCount + 1).padStart(4, '0') : '0001'; // Increment or start at 0001

    return `${prefix}${uniquePart}`;
  }

  async getTotalClients() {
    return this.getEntityCount();
  }

  private mapDataForExport(data: Client[]) {
    const returnData = data.map((e) => {
      const client = {
        id: e.id,
        clientId: e.clientId,
        email: e.email,
        phoneNumber: e.phoneNumber,
        name: e.name,
        address: e.address,
      };
      return client;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<ClientSortKeys> = {
      sortKey: ClientSortKeys.clientId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.clientsRepository
      .createQueryBuilder('client')
      .where('client.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const clients = await query.getMany();
    const mappedClients = this.mapDataForExport(clients);

    return mappedClients;
  }

  async copyPrint(
    sortOptions: SortOptions<ClientSortKeys> = {
      sortKey: ClientSortKeys.clientId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const clients = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Clients\n\nID\tClient\tEmail\tPhone Number\tAddress\n`;

    const data = clients
      .map((e) => {
        const clientId = e.clientId || '-';
        const clientName = e.name || '-';
        const email = e.email || '-';
        const phoneNumber = e.phoneNumber || '-';
        const address = e.address || '-';

        return `${clientId}\t${clientName}\t${email}\t${phoneNumber}\t${address}`;
      })
      .join('\n');

    const exportData = `${header}${data}`;
    const rowCount = clients.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<ClientSortKeys> = {
      sortKey: ClientSortKeys.clientId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const clients = await this.getDataForExport(sortOptions, search);

    const mappedClients = clients.map((e) => {
      const obj = {
        ID: e.clientId,
        User: e.name,
        Email: e.email,
        'Phone Number': e.phoneNumber,
        Address: e.address,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedClients);
  }

  async generateExcelFile(
    sortOptions: SortOptions<ClientSortKeys> = {
      sortKey: ClientSortKeys.clientId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const clients = await this.getDataForExport(sortOptions, search);

    const mappedClients = clients.map((e) => {
      const obj = {
        ID: e.clientId,
        User: e.name,
        Email: e.email,
        'Phone Number': e.phoneNumber,
        Address: e.address,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedClients, 'Client');
  }

  async generatePdf(
    sortOptions: SortOptions<ClientSortKeys> = {
      sortKey: ClientSortKeys.clientId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const clients = await this.getDataForExport(sortOptions, search);

    const mappedClients = clients.map((e) => {
      const obj = {
        ID: e.clientId,
        User: e.name,
        Email: e.email,
        'Phone Number': e.phoneNumber,
        Address: e.address,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedClients,
      'Smart Fleet SaaS - Client',
    );
  }
}
