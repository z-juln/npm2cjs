import path from 'path';
import fs from 'fs-extra';
import Npm2cjs from '../../npm2cjs';

const outputRoot = path.resolve(__dirname, '../build/npm2cjs');

const targets = [
  // esm + 设置了typings
  'chalk',
  // cjs + 没设置typings + 有index.d.ts
  'open',
  // cjs + 没设置typings + 有@types/glob
  'glob',
  // cjs + 没设置typings + 没有@types/open
  'np-guard',
];

fs.emptyDirSync(outputRoot);

const tasks = targets.map(target => {
  const outputDir = path.resolve(outputRoot, target);
  return new Npm2cjs({
    targetDir: path.resolve(__dirname, `../node_modules/${target}`),
    outputDir,
    tryInsertTypes: true,
  })
    .generate()
    .then(() => {
      console.log(`\n🌟 <${target}>构建成功: ${outputDir}\n`);
      console.log(`\n🌟 请手动测试上述包的正确与否, 包所在目录为: ${outputDir}\n`);
    });
});

Promise.all(tasks).then(() => {
  console.log('\n🌟 全部构建成功\n');
  console.log(`\n🌟 请手动测试上述包的正确与否, 包所在目录为: ${outputRoot}\n`);
});
