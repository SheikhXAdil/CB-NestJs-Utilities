import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BaseLogger } from 'src/common/classes/BaseLogger';
import {
  APIFailureResponse,
  APISuccessResponse,
} from 'src/common/classes/BaseResponse';
import { ApiOkResponseGeneric } from 'src/common/decorators/response/generic-responses';
import { getErrorStatusCode } from 'src/common/utilities/err-status';
import {
  DashboardIncomeExpenseMonthlyReportResDto,
  DashboardTotalsResDto,
} from 'src/dashboard/dashboard.dto';
import { DashboardService } from 'src/dashboard/services/dashboard/dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController extends BaseLogger {
  constructor(private readonly dashboardService: DashboardService) {
    super();
  }

  /**
   * Get totals for dashboard
   */
  @ApiOkResponseGeneric(DashboardTotalsResDto)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('totals')
  async getDashboardTotals() {
    try {
      const data = await this.dashboardService.getDashboardTotals();
      return new APISuccessResponse<DashboardTotalsResDto>(data);
    } catch (err) {
      this.logError('getDashboardTotals', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get income expense report for dashboard
   */
  @ApiOkResponseGeneric(DashboardIncomeExpenseMonthlyReportResDto)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('report')
  async getIncomeExpenseReport() {
    try {
      const data = await this.dashboardService.getIncomeExpenseReport();
      return new APISuccessResponse<DashboardIncomeExpenseMonthlyReportResDto>(
        data,
      );
    } catch (err) {
      this.logError('getDashboardTotals', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
