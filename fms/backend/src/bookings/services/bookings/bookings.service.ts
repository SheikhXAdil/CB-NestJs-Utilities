import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment-timezone';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import {
  BookingSortKeys,
  CreateBookingDto,
  UpdateBookingDto,
} from 'src/bookings/dto/booking.dto';
import { Booking } from 'src/bookings/entities/booking.entity';
import { ClientsService } from 'src/clients/services/clients/clients.service';
import { SortOptions } from 'src/common/classes/Sorting';
import { dateTimeResMomentFormat } from 'src/common/utilities/formats';
import { ExportService } from 'src/export/export.service';
import { DriversService } from 'src/drivers/services/driver/drivers.service';
import { VehiclesService } from 'src/vehicles/services/vehicles/vehicles.service';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly vehiclesService: VehiclesService,
    private readonly driversService: DriversService,
    private readonly clientsService: ClientsService,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<BookingSortKeys> = {
      sortKey: BookingSortKeys.bookingId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.vehicle', 'vehicle')
      .leftJoinAndSelect('booking.driver', 'driver')
      .leftJoinAndSelect('booking.client', 'client')
      .where('booking.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const bookings = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(bookings);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<Booking>,
    search: string,
  ) {
    if (search) {
      const trimmedSearch = search.toLowerCase().trim().replace(/\s+/g, ' '); // Normalize spaces
      const dateMatch = trimmedSearch.match(
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i, // Match month and optionally day
      );
      const parameters = {};

      // Extract date components
      let month: number | null = null;

      if (dateMatch) {
        const monthString = dateMatch[1]; // Match group for the month

        const parsedDate = moment(`${monthString}`, 'MMM', true);

        if (parsedDate.isValid()) {
          month = parsedDate.month() + 1; // Moment months are 0-based
        }

        // Remove the date part from the search string for further processing
        search = trimmedSearch.replace(dateMatch[0], '').trim();
      }

      // Build the query dynamically
      const ilikeConditions = [];
      const dateCondition = [];
      const searchTerms = search.split(' ').filter((term) => term); // Split remaining terms and remove empty strings

      // Add date filter if a valid date was extracted
      if (month) {
        // Match the entire month
        dateCondition.push(
          `EXTRACT(MONTH FROM booking.startDateTime) = :month`,
        );
        parameters['month'] = month;
      }

      // Add text search filters
      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `vehicle.name ILIKE :${paramName} OR driver.name ILIKE :${paramName} OR client.name ILIKE :${paramName} OR booking.status ILIKE :${paramName} OR booking.paymentStatus ILIKE :${paramName}`,
        );
        parameters[paramName] = `%${term}%`;
      });

      // Combine conditions with AND
      if (ilikeConditions.length > 0 || dateCondition.length > 0) {
        // Filter out empty strings to avoid syntax issues
        const combinedConditions = [
          ...dateCondition,
          ilikeConditions.length > 0 ? `(${ilikeConditions.join(' OR ')})` : '',
        ].filter((condition) => condition.trim() !== ''); // Remove empty strings

        if (combinedConditions.length > 0) {
          query.andWhere(`(${combinedConditions.join(' OR ')})`, parameters);
        }
      }
    }

    return query;
  }

  private applySortingQueryForFindAll(
    query: SelectQueryBuilder<Booking>,
    sortOptions: SortOptions<BookingSortKeys>,
  ) {
    if (sortOptions.sortKey === BookingSortKeys.vehicleName) {
      query = query.orderBy(`vehicle.name`, sortOptions.sortOrder);
    } else if (sortOptions.sortKey === BookingSortKeys.driverName) {
      query = query.orderBy(`driver.name`, sortOptions.sortOrder);
    } else if (sortOptions.sortKey === BookingSortKeys.clientName) {
      query = query.orderBy(`client.name`, sortOptions.sortOrder);
    } else {
      query = query.orderBy(
        `booking.${sortOptions.sortKey}`,
        sortOptions.sortOrder,
      );
    }

    return query;
  }

  private mapDataForFindAll(data: Pagination<Booking>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const booking = {
        id: e.id,
        bookingId: e.bookingId,
        status: e.status,
        paymentStatus: e.paymentStatus,
        startDateTime: moment(e.startDateTime).format(dateTimeResMomentFormat),
        endDateTime: moment(e.endDateTime).format(dateTimeResMomentFormat),
        vehicleName: e.vehicle ? e.vehicle.name : '-',
        driverName: e.driver ? e.driver.name : '-',
        clientName: e.client ? e.client.name : '-',
      };
      return booking;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<Booking>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const booking = await this.bookingsRepository.findOne({
      where: options,
      relations,
    });

    if (!booking && throwException) {
      throw new NotFoundException(`No such Booking found!`);
    }

    return booking;
  }

  async create(createBookingDto: CreateBookingDto) {
    const booking = this.bookingsRepository.create(createBookingDto);

    booking.startDateTime = moment.utc(
      createBookingDto.startDateTime,
      'DD/MM/YYYY HH:mm',
    );

    booking.endDateTime = moment.utc(
      createBookingDto.endDateTime,
      'DD/MM/YYYY HH:mm',
    );

    const vehicle = await this.vehiclesService.findOne({
      id: createBookingDto.vehicleId,
    });
    booking.vehicle = vehicle;

    const driver = await this.driversService.findOne({
      id: createBookingDto.driverId,
    });
    booking.driver = driver;

    const client = await this.clientsService.findOne({
      id: createBookingDto.clientId,
    });
    booking.client = client;

    booking.bookingId = await this.getBookingId();

    return await this.bookingsRepository.save(booking);
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    let booking: any = await this.findOne({ id });

    booking = { ...booking, ...updateBookingDto };

    if (updateBookingDto.startDateTime) {
      booking.startDateTime = moment.utc(
        updateBookingDto.startDateTime,
        'DD/MM/YYYY HH:mm',
      );
    }
    if (updateBookingDto.endDateTime) {
      booking.endDateTime = moment.utc(
        updateBookingDto.endDateTime,
        'DD/MM/YYYY HH:mm',
      );
    }

    return await this.bookingsRepository.save(booking);
  }

  async remove(id: string) {
    const booking = await this.findOne({ id });

    booking.deletedAt = moment.tz();
    booking.isDeleted = true;

    return await this.bookingsRepository.save(booking);
  }

  private async getEntityCount() {
    const entityCount = await this.bookingsRepository.count();

    return entityCount;
  }

  async getBookingId() {
    const prefix = 'BOK-';

    const entityCount = await this.getEntityCount();

    const uniquePart =
      entityCount !== 0 ? String(entityCount + 1).padStart(4, '0') : '0001'; // Increment or start at 0001

    return `${prefix}${uniquePart}`;
  }

  async getTotalBookings() {
    return this.getEntityCount();
  }

  async getTotalIncome() {
    const data = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.totalAmount)', 'totalIncome')
      .getRawOne();

    return data.totalIncome;
  }

  async getMonthlyIncomeReport(year: number) {
    const data = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select([
        "to_char(booking.startDateTime, 'FMMonth') AS month", // Fetch full month names
        'SUM(booking.totalAmount) AS income',
      ])
      .where('EXTRACT(YEAR FROM booking.startDateTime) = :year', { year })
      .groupBy("to_char(booking.startDateTime, 'FMMonth')")
      .addGroupBy('booking.startDateTime')
      .orderBy('EXTRACT(MONTH FROM booking.startDateTime)', 'ASC')
      .getRawMany();

    const monthlyReport = {
      January: 0,
      February: 0,
      March: 0,
      April: 0,
      May: 0,
      June: 0,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 0,
    };

    for (const obj of data) {
      monthlyReport[obj.month] += obj.income;
    }

    return monthlyReport;
  }

  private mapDataForExport(data: Booking[]) {
    const returnData = data.map((e) => {
      const booking = {
        id: e.id,
        bookingId: e.bookingId,
        status: e.status,
        paymentStatus: e.paymentStatus,
        startDateTime: moment(e.startDateTime).format(dateTimeResMomentFormat),
        endDateTime: moment(e.endDateTime).format(dateTimeResMomentFormat),
        vehicleName: e.vehicle ? e.vehicle.name : '-',
        driverName: e.driver ? e.driver.name : '-',
        clientName: e.client ? e.client.name : '-',
      };
      return booking;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<BookingSortKeys> = {
      sortKey: BookingSortKeys.bookingId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.vehicle', 'vehicle')
      .leftJoinAndSelect('booking.driver', 'driver')
      .leftJoinAndSelect('booking.client', 'client')
      .where('booking.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const bookings = await query.getMany();
    const mappedBookings = this.mapDataForExport(bookings);

    return mappedBookings;
  }

  async copyPrint(
    sortOptions: SortOptions<BookingSortKeys> = {
      sortKey: BookingSortKeys.bookingId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const bookings = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Bookings\n\nID\tClient\tDriver\tVehicle\tDuration\tStatus\tPayment Status\n`;

    const data = bookings
      .map((e) => {
        const id = e.id || '-';
        const client = e.clientName || '-';
        const driver = e.driverName || '-';
        const vehicle = e.vehicleName || '-';
        const duration = `${e.startDateTime} - ${e.endDateTime}`;
        const status = e.status || '-';
        const paymentStatus = e.paymentStatus || '-';

        return `${id}\t${client}\t${driver}\t${vehicle}\t${duration}\t${status}\t${paymentStatus}`;
      })
      .join('\n');

    const exportData = `${header}${data}`;
    const rowCount = bookings.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<BookingSortKeys> = {
      sortKey: BookingSortKeys.bookingId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const bookings = await this.getDataForExport(sortOptions, search);

    const mappedBookings = bookings.map((e) => {
      const obj = {
        ID: e.bookingId,
        Client: e.clientName,
        Driver: e.driverName,
        Vehicle: e.vehicleName,
        Duration: `${e.startDateTime} - ${e.endDateTime}`,
        Status: e.status,
        'Payment Status': e.paymentStatus,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedBookings);
  }

  async generateExcelFile(
    sortOptions: SortOptions<BookingSortKeys> = {
      sortKey: BookingSortKeys.bookingId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const bookings = await this.getDataForExport(sortOptions, search);

    const mappedBookings = bookings.map((e) => {
      const obj = {
        ID: e.bookingId,
        Client: e.clientName,
        Driver: e.driverName,
        Vehicle: e.vehicleName,
        Duration: `${e.startDateTime} - ${e.endDateTime}`,
        Status: e.status,
        'Payment Status': e.paymentStatus,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedBookings, 'Booking');
  }

  async generatePdf(
    sortOptions: SortOptions<BookingSortKeys> = {
      sortKey: BookingSortKeys.bookingId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const bookings = await this.getDataForExport(sortOptions, search);

    const mappedBookings = bookings.map((e) => {
      const obj = {
        ID: e.bookingId,
        Client: e.clientName,
        Driver: e.driverName,
        Vehicle: e.vehicleName,
        Duration: `${e.startDateTime} - ${e.endDateTime}`,
        Status: e.status,
        'Payment Status': e.paymentStatus,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedBookings,
      'Smart Fleet SaaS - Booking',
    );
  }
}
