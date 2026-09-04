import { Injectable } from '@nestjs/common';
import { AwsFilesService } from '../aws/aws.service';
import { GcpFilesService } from '../gcp/gcp.service';
import { ConfigService } from '@nestjs/config';
import { DeploymentTypes } from 'src/common/enums/deployments';

@Injectable()
export class FilesService {
  constructor(
    private readonly awsFilesService: AwsFilesService,
    private readonly gcpFilesService: GcpFilesService,
    private readonly configService: ConfigService,
  ) {}

  private DEPLOYMENT = this.configService.get('DEPLOYMENT');

  /**
   * File path is the path after the CF URL.
   * Returns url of uploaded file
   */
  async upload(
    file: Buffer,
    filePath: string,
    mimetype: string,
  ): Promise<string> {
    // TODO Enable when aws and gcp credentials setup is completed
    // if (this.DEPLOYMENT === DeploymentTypes.aws) {
    //   return this.awsFilesService.s3Upload(file, filePath, mimetype);
    // } else if (this.DEPLOYMENT === DeploymentTypes.gcp) {
    //   return this.gcpFilesService.gcpUpload(file, filePath);
    // }

    return filePath;
  }

  /**
   * File path is the path after the CF URL.
   */
  async delete(filePath: string): Promise<void> {
    // TODO Enable when aws and gcp credentials setup is completed
    // if (this.DEPLOYMENT === DeploymentTypes.aws) {
    //   return this.awsFilesService.s3Delete(filePath);
    // } else if (this.DEPLOYMENT === DeploymentTypes.gcp) {
    //   return this.gcpFilesService.gcpDelete(filePath);
    // }
  }

  /**
   * FilePaths are path after the CF URL.
   * Returns new url of copied file to destination
   */
  async copy(sourcePath: string, destinationPath: string): Promise<string> {
    // TODO Enable when aws and gcp credentials setup is completed
    // if (this.DEPLOYMENT === DeploymentTypes.aws) {
    //   return this.awsFilesService.s3Copy(sourcePath, destinationPath);
    // } else if (this.DEPLOYMENT === DeploymentTypes.gcp) {
    //   return this.gcpFilesService.gcpCopy(sourcePath, destinationPath);
    // }
    return destinationPath;
  }
}
