import { Module } from '@nestjs/common';
import { VehicleTypeController } from './controllers/vehicle-type/vehicle-type.controller';
import { InspectionTypeController } from './controllers/inspection-type/inspection-type.controller';
import { VehicleTypeService } from './services/vehicle-type/vehicle-type.service';
import { InspectionTypeService } from './services/inspection-type/inspection-type.service';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { VehicleType } from './entities/vehicle-type.entity';
import { InspectionType } from './entities/inspection-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleType, InspectionType])],
  controllers: [VehicleTypeController, InspectionTypeController],
  providers: [VehicleTypeService, InspectionTypeService, CaslAbilityFactory],
  exports: [VehicleTypeService, InspectionTypeService],
})
export class SystemSetupModule {}
