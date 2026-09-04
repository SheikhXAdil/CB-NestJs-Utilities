import { Module } from '@nestjs/common';
import { ExpensesService } from './services/expenses/expenses.service';
import { ExpensesController } from './controllers/expenses/expenses.controller';
import { FilesModule } from 'src/files/files.module';
import { Expense } from './entities/expense.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { VehiclesModule } from 'src/vehicles/vehicles.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense]), FilesModule, VehiclesModule],
  providers: [ExpensesService, CaslAbilityFactory],
  controllers: [ExpensesController],
  exports: [ExpensesService],
})
export class ExpensesModule {}
