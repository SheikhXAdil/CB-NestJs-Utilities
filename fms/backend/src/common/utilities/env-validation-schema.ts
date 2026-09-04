import * as Joi from 'joi';
import { DeploymentTypes } from '../enums/deployments';

export const envValidationSchema = Joi.object({
  // DB variables
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // jwt
  JWT_KEY: Joi.string().required(),
  LOGIN_TOKEN_EXPIRY: Joi.string().required(),
  PASSWORD_RESET_TOKEN_EXPIRY: Joi.string().required(),

  // encryption
  HASH_SALT_ROUNDS: Joi.number().required(),

  // Deployment
  DEPLOYMENT: Joi.string()
    .valid(...Object.values(DeploymentTypes))
    .required(),

  // mailer email
  MAILER_FROM_EMAIL: Joi.string().required(),

  // mailer cred for gcp
  GMAIL_SMTP_SERVER: Joi.string().when('DEPLOYMENT', {
    is: DeploymentTypes.gcp,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  GMAIL_PORT: Joi.number().when('DEPLOYMENT', {
    is: DeploymentTypes.gcp,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  GMAIL_PORT_SECURE: Joi.bool().when('DEPLOYMENT', {
    is: DeploymentTypes.gcp,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  GMAIL_AUTH_USER: Joi.string().when('DEPLOYMENT', {
    is: DeploymentTypes.gcp,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  GMAIL_AUTH_PASS: Joi.string().when('DEPLOYMENT', {
    is: DeploymentTypes.gcp,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // aws s3 storage
  AWS_S3_BUCKET: Joi.string().when('DEPLOYMENT', {
    is: DeploymentTypes.aws,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_CF_URL: Joi.string().when('DEPLOYMENT', {
    is: DeploymentTypes.aws,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_CF_REGION: Joi.string().when('DEPLOYMENT', {
    is: DeploymentTypes.aws,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // gcp storage
  GCP_BUCKET: Joi.string().when('DEPLOYMENT', {
    is: DeploymentTypes.gcp,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  GCP_CF_URL: Joi.string().when('DEPLOYMENT', {
    is: DeploymentTypes.gcp,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
