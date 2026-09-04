import { Injectable } from '@nestjs/common';
import { ResetPasswordEmailDto } from './dto/payloads/signIn.dto';
import { EmailSubjects, EmailTemplates } from './dto/enums';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { BaseLogger } from 'src/common/classes/BaseLogger';

@Injectable()
export class EmailService extends BaseLogger {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async sendResetPasswordEmail(email: string, payload: ResetPasswordEmailDto) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: this.configService.get('MAILER_FROM_EMAIL'),
        subject: `${EmailSubjects.resetPassword}`,
        template: EmailTemplates.resetPassword,
        context: payload,
      });
    } catch (err) {
      this.logError('sendResetPasswordEmail', err);
    }
  }
}
