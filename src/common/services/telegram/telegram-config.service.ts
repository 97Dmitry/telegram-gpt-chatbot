import { TelegrafModuleOptions, TelegrafOptionsFactory } from 'nestjs-telegraf';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { session } from 'telegraf';

@Injectable()
export class TelegramConfigService implements TelegrafOptionsFactory {
  constructor(private readonly configService: ConfigService) {}
  createTelegrafOptions():
    | Promise<TelegrafModuleOptions>
    | TelegrafModuleOptions {
    return {
      token: this.configService.get<string>('telegram.key'),
      middlewares: [
        session({
          defaultSession: () => {
            return { messages: [] };
          },
        }),
      ],
    };
  }
}
