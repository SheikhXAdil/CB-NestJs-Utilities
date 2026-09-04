import { Module } from '@nestjs/common';
import { BookingsService } from './services/bookings/bookings.service';
import { BookingsController } from './controllers/bookings/bookings.controller';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { VehiclesModule } from 'src/vehicles/vehicles.module';
import { ClientsModule } from 'src/clients/clients.module';
import { DriversModule } from 'src/drivers/drivers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    VehiclesModule,
    ClientsModule,
    DriversModule,
  ],
  providers: [BookingsService, CaslAbilityFactory],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
