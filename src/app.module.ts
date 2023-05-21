import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config } from './config';
import { GptModule } from './gpt/gpt.module';
import { TelegramModule } from './telegram/telegram.module';
import { ConverterModule } from './common/converter/converter.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    GptModule,
    TelegramModule,
    ConverterModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
