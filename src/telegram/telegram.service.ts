import { Injectable, Logger } from '@nestjs/common';
import { Command, Ctx, Message, On, Start, Update } from 'nestjs-telegraf';
import { Scenes, Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { GptService } from '../gpt/gpt.service';
import { allowedUsers } from 'src/common/constants/telegram';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ConverterService } from '../common/converter/converter.service';
import { getUserAudioDirPath } from '../common/utils/getAudioMessageFilePath';
import { code } from 'telegraf/format';
import { ChatCompletionRequestMessage } from 'openai';
import { removeFile } from '../common/utils/removeFile';

type Context = Scenes.SceneContext;

interface Session extends Scenes.SceneSession<Scenes.SceneSessionData> {
  messages: Array<ChatCompletionRequestMessage>;
}

const INITIAL_SESSION: Session = {
  messages: [],
  __scenes: {},
};

@Update()
@Injectable()
export class TelegramService extends Telegraf<Context> {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly gptService: GptService,
    private readonly httpService: HttpService,
    private readonly converterService: ConverterService,
  ) {
    super(configService.get('telegram.key'));
  }

  @Start()
  async onStart(@Ctx() context: Context) {
    await context.reply("It's gpt bot");
  }

  @Command('new')
  async clearSession(@Ctx() context: Context) {
    context.session = INITIAL_SESSION;
  }

  @Command('session')
  async session(@Ctx() context: Context) {
    await context.reply(
      code(JSON.stringify((context.session as Session).messages)),
    );
  }

  @On('text')
  async onMessage(@Message() message, @Ctx() context: Context) {
    if (!this.isAllowedUser(message.from.id)) {
      await context.reply('Ваш аккаунт не имеет прав для использования');
      return;
    }

    (context.session as Session).messages.push({
      role: 'user',
      content: message.text,
    });

    await context.reply(code('Обрабатываю Ваш запрос'));

    const answer = await this.gptService.requestToGptChat(
      (context.session as Session).messages,
    );
    const answerText = answer.choices[0].message.content;

    (context.session as Session).messages.push({
      role: 'assistant',
      content: answerText,
    });

    this.logger.verbose(answer.total_tokens);
    await context.reply(answerText);
  }

  @On('voice')
  async onVoice(@Message() message, @Ctx() context: Context) {
    const userId = message.from.id;
    if (!this.isAllowedUser(userId)) {
      await context.reply('Ваш аккаунт не имеет прав для использования');
      return;
    }

    const filename = message.voice.file_unique_id;

    const link = await context.telegram.getFileLink(message.voice.file_id);
    const fileUrl = link.href;
    const filePath = await this.getAndSaveAudioMessageFileAsMp3(
      fileUrl,
      userId.toString(),
      filename,
    );
    await context.reply(code('Обрабатываю Ваш запрос'));
    const messageText = await this.gptService.speechToText(filePath);
    await removeFile(filePath);
    (context.session as Session).messages.push({
      role: 'user',
      content: messageText,
    });

    const answer = await this.gptService.requestToGptChat(
      (context.session as Session).messages,
    );

    const answerText = answer.choices[0].message.content;

    (context.session as Session).messages.push({
      role: 'assistant',
      content: answerText,
    });

    await context.reply(answerText);
  }

  private isAllowedUser(id: number) {
    return allowedUsers.includes(id);
  }

  private async getAndSaveAudioMessageFileAsMp3(
    url: string,
    userId: string,
    filename: string,
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(url, { responseType: 'stream' }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        }),
      ),
    );

    const dirPath = getUserAudioDirPath(userId);
    const oggFilePath = resolve(dirPath, `${filename}.ogg`);
    const mp3FilePath = resolve(dirPath, `${filename}.mp3`);

    if (!existsSync(dirPath)) {
      mkdirSync(dirPath);
    }

    const stream = createWriteStream(oggFilePath);
    await data.pipe(stream);

    await this.converterService.convertOggToMp3(oggFilePath, mp3FilePath);
    return mp3FilePath;
  }
}
