import fs from 'fs/promises';

// 获取并过滤某个文件夹下的内容
export const getDirContent = async (path: string, type: 'dir' | 'file') => {
  const contentnList = await fs.readdir(path, { withFileTypes: true });
  return contentnList
    .filter(item => type === 'dir' ? item.isDirectory() : item.isFile())
    .map(item => item.name);
};

// 文件夹下最多类型的文件
export const getMostFormatInDir = async (path: string, options?: string[]) => {
  const formatCount: Record<string, number> = {};
  const dirContent = await getDirContent(path, 'file');
  dirContent.map(file => {
    const suffix = file.split('.').at(-1) || '';
    if(!options || options.includes(suffix)) {
      formatCount[suffix] = formatCount[suffix] ? formatCount[suffix] + 1 : 1;
    }
  });
  if(Object.entries(formatCount).length === 0) {
    return undefined;
  }
  return Object.entries(formatCount).sort((a, b) => a[1] - b[1])[0][0];
};