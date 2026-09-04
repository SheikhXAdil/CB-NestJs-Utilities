import {
  AbilityBuilder,
  AbilityClass,
  InferSubjects,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

export type CoreSubjects = InferSubjects<string> | 'all';
export type CoreAppAbility = PureAbility<[string, CoreSubjects]>;
export const CoreAppAbility = PureAbility as AbilityClass<CoreAppAbility>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, build } = new AbilityBuilder(
      PureAbility as AbilityClass<CoreAppAbility>,
    );
    const userRoles = user.roles;

    userRoles.forEach((role) => {
      role.permissions.forEach((per) => {
        can(per.permission, per.entity);
      });
    });

    return build({
      detectSubjectType: (object) => object,
    });
  }
}
