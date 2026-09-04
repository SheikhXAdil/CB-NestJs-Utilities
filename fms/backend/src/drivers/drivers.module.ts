import { Module } from '@nestjs/common';
import { DriversController } from './controllers/drivers/drivers.controller';
import { DriversService } from './services/driver/drivers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [TypeOrmModule.forFeature([Driver]), FilesModule],
  controllers: [DriversController],
  providers: [DriversService, CaslAbilityFactory],
  exports: [DriversService],
})
export class DriversModule {}
