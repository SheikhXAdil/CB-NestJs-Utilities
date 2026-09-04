import { Module } from '@nestjs/common';
import { FilesService } from './services/files/files.service';
import { AwsFilesService } from './services/aws/aws.service';
import { GcpFilesService } from './services/gcp/gcp.service';

@Module({
  providers: [FilesService, AwsFilesService, GcpFilesService],
  exports: [FilesService, AwsFilesService, GcpFilesService],
})
export class FilesModule {}
