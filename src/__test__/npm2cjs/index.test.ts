import path from 'path';
import Npm2cjs from '../../npm2cjs';

const outputDir = path.resolve(__dirname, '../build/npm2cjs');

new Npm2cjs({
  targetDir: path.resolve(__dirname, '../node_modules/chalk'),
  outputDir,
})
  .generate()
  .then(() => {
    console.log('\n🌟 构建成功\n')
		console.log(`\n🌟 请手动测试上述包的正确与否, 包所在目录为: ${outputDir}\n`);
  });
