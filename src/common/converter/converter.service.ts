import { Injectable, Logger } from '@nestjs/common';
import { Ffmpeg, InjectFluentFfmpeg } from '@mrkwskiti/fluent-ffmpeg-nestjs';
import { path } from '@ffmpeg-installer/ffmpeg';
import { resolve } from 'path';
import { removeFile } from '../utils/removeFile';

@Injectable()
export class ConverterService {
  private readonly logger = new Logger(ConverterService.name);

  constructor(@InjectFluentFfmpeg() private readonly ffmpeg: Ffmpeg) {
    ffmpeg.setFfmpegPath(path);
  }

  async convertOggToMp3(inputPath: string, outputPath: string) {
    try {
      return new Promise((resolve, reject) => {
        this.ffmpeg(inputPath)
          .inputOption('-t 30')
          .output(outputPath)
          .on('error', (error) => reject(error.message))
          .on('end', () => {
            removeFile(inputPath);
            resolve(outputPath);
          })
          .run();
      });
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
