import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseLogger } from 'src/common/classes/BaseLogger';

@Injectable()
export class GcpFilesService extends BaseLogger {
  constructor(private readonly configService: ConfigService) {
    super();
    this.storage = new Storage();
  }

  GCP_BUCKET = this.configService.get('GCP_BUCKET');
  GCP_CF_URL = this.configService.get('GCP_CF_URL');
  private storage: Storage;

  async gcpUpload(file: Buffer, filePath: string) {
    try {
      await this.storage.bucket(this.GCP_BUCKET).file(filePath).save(file);

      return this.GCP_CF_URL + filePath;
    } catch (err) {
      this.logError('gcpUpload', err.message);
    }
  }

  async gcpDelete(filePath: string) {
    try {
      await this.storage.bucket(this.GCP_BUCKET).file(filePath).delete({});
    } catch (err) {
      this.logError('gcpDelete', err.message);
    }
  }

  async gcpCopy(sourcePath: string, destinationPath: string) {
    try {
      await this.storage
        .bucket(this.GCP_BUCKET)
        .file(sourcePath)
        .copy(destinationPath);
      return this.GCP_CF_URL + destinationPath;
    } catch (err) {
      this.logError('gcpCopy', err.message);
    }
  }
}
