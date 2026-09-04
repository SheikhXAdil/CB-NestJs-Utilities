import { Logger, Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { config } from 'dotenv';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as aws from '@aws-sdk/client-ses';
import { DeploymentTypes } from 'src/common/enums/deployments';

config();

const getMailerTransport = () => {
  const deployment = process.env.DEPLOYMENT;

  if (deployment === DeploymentTypes.aws) {
    const ses = new aws.SES({
      apiVersion: '2010-12-01',
      region: 'us-east-1',
    });

    return {
      SES: { ses, aws },
    };
  } else if (deployment === DeploymentTypes.gcp) {
    return {
      host: process.env.GMAIL_SMTP_SERVER, // Gmail SMTP server
      port: process.env.GMAIL_PORT, // 587 for TLS, 465 for SSL
      secure: process.env.GMAIL_PORT_SECURE, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_AUTH_USER, // Your Gmail address
        pass: process.env.GMAIL_AUTH_PASS, // Your Gmail App Password or account password
      },
    };
  }
};

@Module({
  imports: [
    MailerModule.forRoot({
      transport: getMailerTransport(),
      defaults: {
        // Set sender email address
        from: process.env.MAILER_FROM_EMAIL,
      },
      template: {
        dir: join(__dirname, './', 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
