import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import * as moment from 'moment-timezone';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { SortOptions } from 'src/common/classes/Sorting';
import { dateResMomentFormat } from 'src/common/utilities/formats';
import { ExportService } from 'src/export/export.service';
import { FilesService } from 'src/files/services/files/files.service';
import {
  CreateNoteDto,
  NoteFilesUploadDto,
  NoteSortKeys,
  UpdateNoteDto,
} from 'src/notes/dto/note.dto';
import { Note } from 'src/notes/entities/note.entity';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepository: Repository<Note>,
    private readonly filesService: FilesService,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<NoteSortKeys> = {
      sortKey: NoteSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.notesRepository
      .createQueryBuilder('note')
      .where('note.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const notes = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(notes);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<Note>,
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
        dateCondition.push(`EXTRACT(MONTH FROM note.createdAt) = :month`);
        parameters['month'] = month;
      }

      // Add text search filters
      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `note.title ILIKE :${paramName} OR note.description ILIKE :${paramName}`,
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
    query: SelectQueryBuilder<Note>,
    sortOptions: SortOptions<NoteSortKeys>,
  ) {
    query = query.orderBy(`note.${sortOptions.sortKey}`, sortOptions.sortOrder);
    return query;
  }

  private mapDataForFindAll(data: Pagination<Note>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const note = {
        id: e.id,
        title: e.title,
        description: e.description,
        createdAt: moment.utc(e.createdAt).format(dateResMomentFormat),
      };
      return note;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<Note>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const note = await this.notesRepository.findOne({
      where: options,
      relations,
    });

    if (!note && throwException) {
      throw new NotFoundException(`No such Note found!`);
    }

    return note;
  }

  async create(createNoteDto: CreateNoteDto, files: NoteFilesUploadDto) {
    const note = this.notesRepository.create(createNoteDto);

    const savedNote = await this.notesRepository.save(note);

    if (files.attachment.length > 0) {
      savedNote.attachment = await this.uploadAttachment(
        savedNote.id,
        files.attachment[0],
      );
      return await this.notesRepository.save(savedNote);
    } else {
      return savedNote;
    }
  }

  async update(
    id: string,
    updateNoteDto: UpdateNoteDto,
    files: NoteFilesUploadDto,
  ) {
    let note: any = await this.findOne({ id });

    note = { ...note, ...updateNoteDto };

    if (files.attachment.length > 0) {
      note.attachment = await this.updateAttachment(note, files.attachment[0]);
    }

    return await this.notesRepository.save(note);
  }

  async remove(id: string) {
    const note = await this.findOne({ id });

    note.deletedAt = moment.tz();
    note.isDeleted = true;

    return await this.notesRepository.save(note);
  }

  async uploadAttachment(noteId: string, attachment: MemoryStorageFile) {
    const noteHash = createHash('md5').update(noteId).digest('hex');
    const imageType: string = attachment.mimetype.split('/').pop();
    const filePath = `notes/${noteId}/attachment/${noteHash}${moment().unix()}.${imageType}`;

    try {
      const url = await this.filesService.upload(
        attachment.buffer,
        filePath,
        attachment.mimetype,
      );
      return url;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateAttachment(note: Note, attachment: MemoryStorageFile) {
    let deleteFromStorage = false;

    if (!note.attachment) {
      return this.uploadAttachment(note.id, attachment);
    }

    const start = note.attachment.search('com') + 4;
    const originalFilePath = note.attachment.slice(start);

    const noteHash = createHash('md5').update(note.id).digest('hex');
    const imageType: string = attachment.mimetype.split('/').pop();
    const filePath = `notes/${note.id}/attachment/${noteHash}${moment().unix()}.${imageType}`;

    if (filePath !== originalFilePath) {
      deleteFromStorage = true;
    }

    try {
      if (deleteFromStorage) {
        await this.filesService.delete(originalFilePath);
      }
      const url = await this.filesService.upload(
        attachment.buffer,
        filePath,
        attachment.mimetype,
      );
      return url;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteAttachment(attachment: string) {
    const start = attachment.search('com') + 4;
    const attachmentFilePath = attachment.slice(start);

    return await this.filesService.delete(attachmentFilePath);
  }

  private mapDataForExport(data: Note[]) {
    const returnData = data.map((e) => {
      const note = {
        id: e.id,
        title: e.title,
        description: e.description,
        createdAt: moment.utc(e.createdAt).format(dateResMomentFormat),
      };
      return note;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<NoteSortKeys> = {
      sortKey: NoteSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.notesRepository
      .createQueryBuilder('note')
      .where('note.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const notes = await query.getMany();
    const mappedNotes = this.mapDataForExport(notes);

    return mappedNotes;
  }

  async copyPrint(
    sortOptions: SortOptions<NoteSortKeys> = {
      sortKey: NoteSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const notes = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Notes\n\nTitle\tDescription\tCreated At\n`;

    const data = notes
      .map((e) => {
        const title = e.title || '';
        const description = e.description || '';
        const createdAt = e.createdAt || '-';

        return `${title}\t${description}\t${createdAt}`;
      })
      .join('\n');

    const exportData = `${header}${data}`;
    const rowCount = notes.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<NoteSortKeys> = {
      sortKey: NoteSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const notes = await this.getDataForExport(sortOptions, search);

    const mappedNotes = notes.map((e) => {
      const obj = {
        Title: e.title,
        Description: e.description,
        'Created At': e.createdAt,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedNotes);
  }

  async generateExcelFile(
    sortOptions: SortOptions<NoteSortKeys> = {
      sortKey: NoteSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const notes = await this.getDataForExport(sortOptions, search);

    const mappedNotes = notes.map((e) => {
      const obj = {
        Title: e.title,
        Description: e.description,
        'Created At': e.createdAt,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedNotes, 'Note');
  }

  async generatePdf(
    sortOptions: SortOptions<NoteSortKeys> = {
      sortKey: NoteSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const notes = await this.getDataForExport(sortOptions, search);

    const mappedNotes = notes.map((e) => {
      const obj = {
        Title: e.title,
        Description: e.description,
        'Created At': e.createdAt,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedNotes,
      'Smart Fleet SaaS - Note',
    );
  }
}
