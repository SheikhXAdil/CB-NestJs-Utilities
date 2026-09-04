import { Module } from '@nestjs/common';
import { VehicleInspectionsService } from './services/vehicle-inspections/vehicle-inspections.service';
import { VehicleInspectionsController } from './controllers/vehicle-inspections/vehicle-inspections.controller';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesModule } from 'src/vehicles/vehicles.module';
import { UsersModule } from 'src/users/users.module';
import { Inspection } from './entities/vehicle-inspection.entity';
import { SystemSetupModule } from 'src/system-setup/system-setup.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inspection]),
    VehiclesModule,
    UsersModule,
    SystemSetupModule,
  ],
  providers: [VehicleInspectionsService, CaslAbilityFactory],
  controllers: [VehicleInspectionsController],
  exports: [VehicleInspectionsService],
})
export class VehicleInspectionsModule {}
