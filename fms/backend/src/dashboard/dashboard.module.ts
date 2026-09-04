import { Module } from '@nestjs/common';
import { DashboardService } from './services/dashboard/dashboard.service';
import { DashboardController } from './controllers/dashboard/dashboard.controller';
import { ClientsModule } from 'src/clients/clients.module';
import { BookingsModule } from 'src/bookings/bookings.module';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { FuelModule } from 'src/fuel/fuel.module';
import { VehicleServicesModule } from 'src/vehicle-services/vehicle-services.module';

@Module({
  imports: [
    ClientsModule,
    BookingsModule,
    ExpensesModule,
    FuelModule,
    VehicleServicesModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
