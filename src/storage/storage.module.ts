import { Module } from '@nestjs/common';
import { S3StorageStrategy } from './strategy/s3-storage.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [S3StorageStrategy],
  exports: [S3StorageStrategy],
})
export class StorageModule {}
