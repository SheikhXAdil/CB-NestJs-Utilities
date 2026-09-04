import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from 'src/strategy/jwt.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    JwtModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_KEY,
      signOptions: { expiresIn: process.env.LOGIN_TOKEN_EXPIRY },
    }),
    forwardRef(() => UsersModule),
  ],
  providers: [
    // CaslAbilityFactory,
    AuthService,
    JwtService,
    JwtStrategy,
  ],
  exports: [
    // CaslAbilityFactory,
    AuthService,
    JwtService,
    JwtStrategy,
  ],
})
export class AuthModule {}
