import path from 'path';
import { getDirContent, getMostFormatInDir } from './utils/dir';
import { execPromise } from './utils/exec';
import fs from 'fs/promises';
import { getConfig } from './utils/config';

const IMG_SOURCE_DIR = 'img_source';
const WEBM_RESULT_DIR = 'webm_result';
const SUPPORTED_IMG_FORMAT = ['jpg', 'png'];

interface ICharInfo {
  name: string;
  expressions: string[];
}

// 读取img_source目录下每个人物的每个表情
const extractCharacterExpressions = async () => {
  const characterDirList = await getDirContent(IMG_SOURCE_DIR, 'dir');
  // 构造人物的表情
  const characterList: ICharInfo[] = [];
  await Promise.all(characterDirList.map(async char => {
    const charDirPath = path.join(IMG_SOURCE_DIR, char);
    const expDirList = await getDirContent(charDirPath, 'dir');
    characterList.push({
      name: char,
      expressions: expDirList,
    })
  }))
  return characterList;
}

// 根据表情生成中间webm文件
const createMiddleMoveFromCharInfo = async ({ name, expressions }: ICharInfo) => {
  const config = await getConfig();
  const { fps, ffmpegInputPattern } = config;
  await Promise.all(expressions.map(async exp => {
    const expFilePath = path.join(IMG_SOURCE_DIR, name, exp);
    // 判断应该取哪种格式的文件
    const mostFormat = await getMostFormatInDir(expFilePath, SUPPORTED_IMG_FORMAT);
    // 当前表情内容为空
    if(!mostFormat) {
      console.log(`人物 ${name} 的表情 ${exp} 的内容为空，自动跳过`)
      return;
    }
    // 产物目录，先尝试清空再尝试创建
    const outputCharaterDir = path.join(WEBM_RESULT_DIR, name);
    try {
      await fs.rm(outputCharaterDir, { recursive: true });
    } catch (error) {}
    await fs.mkdir(outputCharaterDir, { recursive: true })
    // 输出文件的前缀
    const outputFilePrefix = path.join(WEBM_RESULT_DIR, name, exp);
    // 使用ffmpeg生成中间文件和结果
    // ffmpeg -r 帧率 -i 输入文件路径
    console.log(`开始处理人物 ${name} 的表情 ${exp}`);
    const ffmpgExpFilePath = path.join(expFilePath, ffmpegInputPattern + '.' + mostFormat);
    await execPromise(`ffmpeg -r ${fps} -i ${ffmpgExpFilePath} -c:v libvpx-vp9 -crf 18 -b:v 0 -row-mt 1 -pix_fmt yuv420p ${outputFilePrefix}_origin.webm`);
    await execPromise(`ffmpeg -r ${fps} -i ${ffmpgExpFilePath} -vf alphaextract,format=yuv420p -crf 35 -b:v 0 -row-mt 1 ${outputFilePrefix}_mask.webm`);
    await execPromise(`ffmpeg -i ${outputFilePrefix}_origin.webm -i ${outputFilePrefix}_mask.webm -filter_complex hstack ${outputFilePrefix}.webm`);
    // 删除中间文件
    if(config.deleteMiddleWebm) {
      await fs.rm(`${outputFilePrefix}_origin.webm`);
      await fs.rm(`${outputFilePrefix}_mask.webm`);
    }
    // 添加第一张图作为首屏图
    if(config.copyFirstImage) {
      const firstImgName = (await getDirContent(expFilePath, "file"))[0];
      const firstImgPath = path.join(expFilePath, firstImgName);
      await fs.copyFile(firstImgPath, `${outputFilePrefix}.${mostFormat}`)
    };
    console.log(`人物 ${name} 的表情 ${exp} 处理完毕，输出到${outputFilePrefix}.webm`)
  }))
};

const main = async () => {
  console.log("欢迎使用林彼丢开发的Renpy帧动画转webm工具");
  console.log("项目链接：https://github.com/libudu/renpy-frame2webm\n")
  const charInfoList = await extractCharacterExpressions();
  for(let charInfo of charInfoList) {
    console.log(`开始处理角色 ${charInfo.name}`)
    await createMiddleMoveFromCharInfo(charInfo);
  }
  console.log("所有内容处理完毕，请关闭程序");
  process.openStdin();
};

main();