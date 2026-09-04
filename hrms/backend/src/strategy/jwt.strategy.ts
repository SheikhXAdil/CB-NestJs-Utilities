import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayloadDto } from 'src/auth/dto/payload.dto';
// import { User } from 'src/user/entities/user.entity';
import { UsersService } from 'src/users/services/users/users.service';

config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_KEY'),
    });
  }

  async validate(payload: AccessTokenPayloadDto) {
    const { id } = payload;
    const user = await this.userService.findOne({ id }, true, [
      'roles',
      'roles.permissions',
    ]);

    return user;
  }
}
