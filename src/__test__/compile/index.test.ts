import path from "path";
import fs from 'fs-extra';
import compile from '../../compile';
import { simpleError } from './../../utils';
import { NpmInfo } from "../../interface";

const npmInfoList: Record<string, NpmInfo> = {
	// esm + cjs + json
	'local-test': {
		dir: path.resolve(__dirname, './local-test'),
		name: 'local-test',
		version: '0.0.0',
	},
	// // esm + cjs
	// inquirer: {
	// 	dir: path.resolve(__dirname, '../node_modules/inquirer'),
	// 	name: 'inquirer',
	// 	version: '9.1.4',
	// 	main: 'lib/inquirer.js',
	// },
	// esm + cjs + package.json的imports的多环境配置
	chalk: {
		dir: path.resolve(__dirname, '../node_modules/chalk'),
		name: 'chalk',
		version: '5.2.0',
		main: './source/index.js',
	},
	// cjs
	open: {
		dir: path.resolve(__dirname, '../node_modules/open'),
		name: 'open',
		version: '8.4.0',
	},
};

const errorNpmList: string[] = [];
const productDir = path.resolve(__dirname, './build');

fs.emptyDirSync(productDir);

const promiseList = Object.entries(npmInfoList).map(([name, npmInfo]) => {
	const productFilepath = path.resolve(productDir, `./${name}.js`);
	return compile(npmInfo, productFilepath)
		.then(() => console.log(`\n🌟 <${name}>构建成功: ${productFilepath}\n`))
		.catch(() => {
			errorNpmList.push(name);
			console.log(`\n❌ <${name}>构建失败\n`);
		});
});

Promise.all(promiseList)
	.then(() => {
		console.log('\n🌟 全部构建成功\n');
		console.log(`\n🌟 请手动测试上述包的正确与否, 包所在目录为: ${productDir}\n`);
	})
	.catch(() => {
		const errorMsg = `\n❌ <${errorNpmList.join(', ')}>构建失败\n`;
		throw simpleError(errorMsg);
	});
