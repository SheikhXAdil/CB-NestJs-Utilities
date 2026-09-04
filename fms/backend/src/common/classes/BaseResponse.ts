import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IPaginationMeta } from 'nestjs-typeorm-paginate';
import { PaginationMetaClass } from './pagination';

export enum APIStatus {
  Success = 'Success',
  Failure = 'Failure',
}

export class APIBaseResponse<T> {
  constructor(status: APIStatus, code: number, message: string, data?: T) {
    this.status = status;
    this.statusCode = code;
    this.message = message;
    if (data) {
      this.data = data;
    }
  }

  @ApiProperty({ enum: APIStatus })
  status: APIStatus;
  @ApiProperty()
  message: string;
  @ApiProperty()
  statusCode: number;

  @ApiProperty({ type: Object })
  data: T = {} as T;
}

export class APISuccessResponse<T> extends APIBaseResponse<T> {
  constructor(data: T) {
    super(
      APIStatus.Success,
      HttpStatus.OK,
      'Request Completed Successfully',
      data,
    );
  }
}

export class APIFailureResponse<T> extends APIBaseResponse<T> {
  constructor(
    code: number = HttpStatus.INTERNAL_SERVER_ERROR,
    message: string = 'Error processing the request',
  ) {
    super(
      APIStatus.Failure,
      code,
      code === HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Error processing the request'
        : message,
    );
  }
}

export class APIPaginatedResponse<T> extends APIBaseResponse<T> {
  constructor(data: T, meta: IPaginationMeta) {
    super(
      APIStatus.Success,
      HttpStatus.OK,
      'Request Completed Successfully',
      data,
    );
    this.meta = meta;
  }

  @ApiProperty({ type: PaginationMetaClass })
  meta: PaginationMetaClass;
}
