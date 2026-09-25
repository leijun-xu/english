import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';

@Module({
  providers: [MinioService],
  exports: [MinioService] //导出MinioService给其他地方用
})
export class MinioModule { }
