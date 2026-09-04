import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { CaslModule } from './casl/casl.module';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './common/utilities/env-validation-schema';
import { EncryptionModule } from './encryption/encryption.module';
import { EmailModule } from './email/email.module';
import { LoggerModule } from './logger/logger.module';
import { ClientsModule } from './clients/clients.module';
import { FilesModule } from './files/files.module';
import { DriversModule } from './drivers/drivers.module';
import { NotesModule } from './notes/notes.module';
import { ContactsModule } from './contacts/contacts.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { SystemSetupModule } from './system-setup/system-setup.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FuelModule } from './fuel/fuel.module';
import { BookingsModule } from './bookings/bookings.module';
import { VehicleServicesModule } from './vehicle-services/vehicle-services.module';
import { VehicleInspectionsModule } from './vehicle-inspections/vehicle-inspections.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    DbModule,
    UsersModule,
    RolesModule,
    AuthModule,
    CaslModule,
    EncryptionModule,
    EmailModule,
    LoggerModule,
    ClientsModule,
    FilesModule,
    DriversModule,
    NotesModule,
    ContactsModule,
    VehiclesModule,
    SystemSetupModule,
    ExpensesModule,
    FuelModule,
    VehicleServicesModule,
    BookingsModule,
    VehicleInspectionsModule,
    DashboardModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
