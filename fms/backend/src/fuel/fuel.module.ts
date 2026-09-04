import { Module } from '@nestjs/common';
import { FuelService } from './services/fuel/fuel.service';
import { FuelController } from './controllers/fuel/fuel.controller';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fuel } from './entities/fuel.entity';
import { FilesModule } from 'src/files/files.module';
import { VehiclesModule } from 'src/vehicles/vehicles.module';
import { DriversModule } from 'src/drivers/drivers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fuel]),
    FilesModule,
    VehiclesModule,
    DriversModule,
  ],
  providers: [FuelService, CaslAbilityFactory],
  controllers: [FuelController],
  exports: [FuelService],
})
export class FuelModule {}
