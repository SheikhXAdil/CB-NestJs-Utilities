import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { Action } from 'src/casl/casl-ability.factory/actions.enum';
import { CoreAppAbility } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { BaseLogger } from 'src/common/classes/BaseLogger';
import {
  APIFailureResponse,
  APIPaginatedResponse,
  APISuccessResponse,
} from 'src/common/classes/BaseResponse';
import { ApiPaginatedQueryOptions } from 'src/common/decorators/query/swagger-pagination-options';
import {
  ApiOkResponseGeneric,
  ApiOkResponseGenericPaginated,
} from 'src/common/decorators/response/generic-responses';
import {
  CheckPolicies,
  PoliciesGuard,
} from 'src/common/guards/policy-guard/policyGuard';
import { PositiveNumericQueryParamValidationPipe } from 'src/common/pipes/numeric-string-validation.pipe';
import { getErrorStatusCode } from 'src/common/utilities/err-status';
import {
  CreateContactDto,
  UpdateContactDto,
} from 'src/contacts/dto/contact.dto';
import { Contact } from 'src/contacts/entities/contact.entity';
import { ContactsService } from 'src/contacts/services/contacts/contacts.service';

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController extends BaseLogger {
  constructor(private readonly contactsService: ContactsService) {
    super();
  }

  /**
   * Create an Contact
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Contact)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, Contact.name),
  )
  @Post()
  async create(@Body() createContactDto: CreateContactDto) {
    try {
      const data = await this.contactsService.create(createContactDto);
      return new APISuccessResponse<Contact>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update a Contact
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Contact)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, Contact.name),
  )
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    try {
      const data = await this.contactsService.update(id, updateContactDto);
      return new APISuccessResponse<Contact>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all Contacts
   */
  @ApiOkResponseGenericPaginated(Contact)
  @ApiPaginatedQueryOptions()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Contact.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    try {
      const data = await this.contactsService.findAll(paginationOptions);
      return new APIPaginatedResponse<Contact[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get a Contact by id
   */
  @ApiOkResponseGeneric(Contact)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Contact.name),
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.contactsService.findOne({ id });
      return new APISuccessResponse<Contact>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a Contact
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, Contact.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.contactsService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
