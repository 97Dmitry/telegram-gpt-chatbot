import { Module } from '@nestjs/common';
import { ConverterService } from './converter.service';
import { FluentFfmpegModule } from '@mrkwskiti/fluent-ffmpeg-nestjs';

@Module({
  imports: [FluentFfmpegModule.forRoot()],
  providers: [ConverterService],
  exports: [ConverterService],
})
export class ConverterModule {}
