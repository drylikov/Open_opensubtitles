import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3StorageStrategy {
  private readonly s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.getOrThrow('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(filename: string, content: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.configService.getOrThrow('S3_BUCKET'),
      Key: filename,
      Body: content,
      ContentType: 'text/plain',
      ACL: 'private',
    });

    try {
      await this.s3.send(command);
    } catch (err) {
      Logger.error(`Error uploading file to S3: ${err.message}`, err.stack);
      throw new InternalServerErrorException('File upload to S3 failed');
    }
  }

  async getFile(fileId: string) {
    {
      const command = new GetObjectCommand({
        Bucket: this.configService.getOrThrow('S3_BUCKET'),
        Key: fileId,
      });

      try {
        const response = await this.s3.send(command);
        return await response.Body.transformToString();
      } catch (err) {
        if (err.name === 'NoSuchKey') {
          throw new NotFoundException('File not found');
        } else {
          Logger.error(
            `Error retrieving file from S3: ${err.message}`,
            err.stack,
          );
          throw new InternalServerErrorException(
            'File retrieval from S3 failed',
          );
        }
      }
    }
  }
}
