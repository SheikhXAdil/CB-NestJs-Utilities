import { Module } from '@nestjs/common';
import { Role } from './entities/role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './services/permissions/permissions.service';
import { RolesService } from './services/roles/roles.service';
import { Permission } from './entities/permission.entity';
import { RolesController } from './controller/roles/roles.controller';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  providers: [RolesService, PermissionsService, CaslAbilityFactory],
  controllers: [RolesController],
})
export class RolesModule {}
