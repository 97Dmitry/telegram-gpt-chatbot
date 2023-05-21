import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramConfigService } from '../common/services/telegram';
import { GptModule } from '../gpt/gpt.module';
import { HttpModule } from '@nestjs/axios';
import { ConverterModule } from '../common/converter/converter.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useClass: TelegramConfigService,
    }),
    GptModule,
    HttpModule,
    ConverterModule,
  ],
  providers: [TelegramService],
})
export class TelegramModule {}
