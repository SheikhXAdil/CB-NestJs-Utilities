import { Module } from '@nestjs/common';
import { VehicleServicesService } from './services/vehicle-services/vehicle-services.service';
import { VehicleServicesController } from './controllers/vehicle-services/vehicle-services.controller';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/vehicle-service.entity';
import { FilesModule } from 'src/files/files.module';
import { VehiclesModule } from 'src/vehicles/vehicles.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service]), FilesModule, VehiclesModule],
  providers: [VehicleServicesService, CaslAbilityFactory],
  controllers: [VehicleServicesController],
  exports: [VehicleServicesService],
})
export class VehicleServicesModule {}
