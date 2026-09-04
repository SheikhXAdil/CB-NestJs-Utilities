import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { BookingsService } from 'src/bookings/services/bookings/bookings.service';
import { ClientsService } from 'src/clients/services/clients/clients.service';
import { roundToTwoDecimalPlaces } from 'src/common/utilities/functions';
import { ExpensesService } from 'src/expenses/services/expenses/expenses.service';
import { FuelService } from 'src/fuel/services/fuel/fuel.service';
import { VehicleServicesService } from 'src/vehicle-services/services/vehicle-services/vehicle-services.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly bookingsService: BookingsService,
    private readonly expensesService: ExpensesService,
    private readonly fuelService: FuelService,
    private readonly vehicleServicesService: VehicleServicesService,
  ) {}

  async getDashboardTotals() {
    const totalClient = await this.clientsService.getTotalClients();
    const totalBooking = await this.bookingsService.getTotalBookings();
    const totalIncome = await this.bookingsService.getTotalIncome();

    const totalExpenseExpenses =
      await this.expensesService.getTotalExpenseExpenses();
    const totalFuelExpenses = await this.fuelService.getTotalFuelExpenses();
    const totalServiceExpenses =
      await this.vehicleServicesService.getTotalServiceExpenses();

    const totalExpense =
      totalExpenseExpenses + totalFuelExpenses + totalServiceExpenses;

    return {
      totalClient,
      totalBooking,
      totalIncome: roundToTwoDecimalPlaces(totalIncome),
      totalExpense: roundToTwoDecimalPlaces(totalExpense),
    };
  }

  async getIncomeExpenseReport() {
    const year = moment.tz().year();

    const incomeReport =
      await this.bookingsService.getMonthlyIncomeReport(year);

    const expenseExpensesReport =
      await this.expensesService.getMonthlyExpensesExpenseReport(year);
    const fuelExpensesReport =
      await this.fuelService.getMonthlyFuelExpenseReport(year);
    const serviceExpensesReport =
      await this.vehicleServicesService.getMonthlyServiceExpenseReport(year);

    const report = {};

    for (const [key, val] of Object.entries(incomeReport)) {
      report[key] = {};
      report[key].income = val;
      report[key].expense = 0;
    }

    for (const [key, val] of Object.entries(expenseExpensesReport)) {
      report[key].expense += val;
    }

    for (const [key, val] of Object.entries(fuelExpensesReport)) {
      report[key].expense += val;
    }

    for (const [key, val] of Object.entries(serviceExpensesReport)) {
      report[key].expense += val;
    }

    const roundedReport = Object.entries(report).reduce(
      (acc, [month, data]: any) => {
        acc[month] = {
          income: roundToTwoDecimalPlaces(data.income),
          expense: roundToTwoDecimalPlaces(data.expense),
        };
        return acc;
      },
      {},
    );

    return roundedReport;
  }
}
