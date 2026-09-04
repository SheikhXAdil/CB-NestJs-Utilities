import { Module } from '@nestjs/common';
import { VehiclesService } from './services/vehicles/vehicles.service';
import { VehiclesController } from './controllers/vehicles/vehicles.controller';
import { Vehicle } from './entities/vehicle.entity';
import { FilesModule } from 'src/files/files.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { SystemSetupModule } from 'src/system-setup/system-setup.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]),
    FilesModule,
    SystemSetupModule,
  ],
  providers: [VehiclesService, CaslAbilityFactory],
  controllers: [VehiclesController],
  exports: [VehiclesService],
})
export class VehiclesModule {}
