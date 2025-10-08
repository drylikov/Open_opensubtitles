import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from './storage/storage.module';
import { SubtitleModule } from './subtitle/subtitle.module';

@Module({
  imports: [ConfigModule.forRoot(), StorageModule, SubtitleModule],
})
export class AppModule {}
