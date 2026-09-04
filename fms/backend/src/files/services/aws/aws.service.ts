import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BaseLogger } from 'src/common/classes/BaseLogger';

@Injectable()
export class AwsFilesService extends BaseLogger {
  constructor(private readonly configService: ConfigService) {
    super();
    this.s3 = new S3Client({ region: configService.get('AWS_S3_REGION') });
  }

  AWS_S3_BUCKET = this.configService.get('AWS_S3_BUCKET');
  AWS_CF_URL = this.configService.get('AWS_CF_URL');
  private s3;

  async s3Upload(file: Buffer, filePath: string, mimetype: string) {
    // console.log(file);

    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: filePath,
      Body: file,
      ContentType: mimetype,
    };

    // const urlParams = {
    //   Bucket: bucket,
    //   Key: filePath,
    //   // Expires: 1800,
    // };

    try {
      await this.s3.send(
        new PutObjectCommand({
          ...params,
        }),
      );
      //   const command = new GetObjectCommand({ ...urlParams });
      //   await getSignedUrl(this.s3, command, { expiresIn: 1800 });
      return this.AWS_CF_URL + filePath;
    } catch (err) {
      this.logError('s3Upload', err.message);
    }
  }

  async s3Delete(filePath: string) {
    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: filePath,
    };

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          ...params,
        }),
      );
    } catch (err) {
      this.logError('s3Delete', err.message);
    }
  }

  async s3Copy(sourcePath: string, destinationPath: string) {
    const params = {
      Bucket: this.AWS_S3_BUCKET,
      CopySource: `${this.AWS_S3_BUCKET}/${sourcePath}`,
      Key: destinationPath,
    };

    try {
      await this.s3.send(
        new CopyObjectCommand({
          ...params,
        }),
      );

      return this.AWS_CF_URL + destinationPath;
    } catch (err) {
      this.logError('s3Copy', err.message);
    }
  }
}
