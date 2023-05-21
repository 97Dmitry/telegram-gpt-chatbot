import { join } from 'path';

export const getUserAudioDirPath = (dir: string) => {
  return join(process.cwd(), 'storage', 'telegram', 'audio', dir);
};
