import fs from 'fs/promises';
import JSON5 from 'json5';

interface IConfig {
  // 是否删除中间生成的origin、mask等webm文件，默认删除节省空间保持目录干净
  deleteMiddleWebm: boolean;
  // ffmpeg命令输入文件的匹配格式，如果不知道含义不要改动
  // 默认是匹配001.jpg这样的文件，如果文件数量达到了四位数，可以改成%04d,
  ffmpegInputPattern: string;
  // 是否自动复制素材的第一张图作为首屏图
  copyFirstImage: boolean;
  // 输出文件的帧率，最好与帧动画素材的帧率保持一致
  fps: number;
}

const CONFIG_FILE_PATH = 'config.json';

let config: IConfig;

export const getConfig = async () => {
  if(!config) {
    const fileContent = (await fs.readFile(CONFIG_FILE_PATH)).toString();
    config = JSON5.parse(fileContent) as any;
  }
  return config;
};