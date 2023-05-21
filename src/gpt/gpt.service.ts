import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionRequest,
  CreateChatCompletionResponseChoicesInner,
  OpenAIApi,
} from 'openai';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs';

@Injectable()
export class GptService {
  private readonly openAIApi: OpenAIApi;

  constructor(private readonly configService: ConfigService) {
    const configuration = new Configuration({
      apiKey: this.configService.get<string>('openai.key'),
    });

    this.openAIApi = new OpenAIApi(configuration);
  }

  public async requestToGptChat(
    messages: Array<ChatCompletionRequestMessage>,
  ): Promise<{
    choices: Array<CreateChatCompletionResponseChoicesInner>;
    total_tokens: number;
  }> {
    const params: CreateChatCompletionRequest = {
      messages,
      temperature: 1,
      model: 'gpt-3.5-turbo',
    };

    try {
      const response = await this.openAIApi.createChatCompletion(params);

      const {
        data: { choices, usage },
      } = response;

      return { choices, total_tokens: usage.total_tokens };
    } catch (e) {
      throw new InternalServerErrorException('Error when requesting gpt chat');
    }
  }

  async speechToText(path: string) {
    const file = createReadStream(path) as unknown as File;

    const { data } = await this.openAIApi.createTranscription(
      file,
      'whisper-1',
    );
    return data.text;
  }
}
