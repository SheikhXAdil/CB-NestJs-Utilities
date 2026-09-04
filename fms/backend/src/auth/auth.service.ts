import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateToken(email: string | null, id: string) {
    const payload = {
      email,
      id,
    };

    const tokenExpiry = this.configService.get('LOGIN_TOKEN_EXPIRY');

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_KEY'),
        expiresIn: tokenExpiry,
      }),
    };
  }

  async generatePasswordResetToken(email: string, id: string) {
    const payload = {
      email,
      sub: id,
    };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_KEY'),
        expiresIn: this.configService.get('PASSWORD_RESET_TOKEN_EXPIRY'),
      }),
    };
  }

  async verityPasswordResetTokenExpiry(token: string) {
    const decodedToken = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_KEY'),
    }); // throws error if token has expired

    return decodedToken;
  }
}
