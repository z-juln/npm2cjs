// TODO 多exports分别compile !!! 会不会有代码问题, 初始import文件会执行多次?
// TODO exports 多环境分开compile !!!
import path from 'path';
import fs from 'fs-extra';
import clone from 'clone';
import { validatePkg } from '@juln/npm-pkg-version';
import { npmPull } from 'pull-sparse';
import { getNpmReadmeFilename, getTempDir, logo, simpleError } from './utils';
import myPkgJson from '../package.json';
import compile from './compile';
import { NpmInfo, PackageJson } from './interface';

export interface Opts {
  targetDir: string;
  target?: 'auto' | 'esm' | 'esm_top-level-await' | (string & {});
  reformName?: { type: 'scope' | 'prefix' | 'suffix'; value: string } | ((name: string) => string);
  reformPublicPublish?: boolean;
  reformReadme?: 'auto' | ((readme: string | null) => string) | false;
  reformKeywords?: 'auto' | string[] | false;
  outputDir: string;
  /** 尝试下载 @types/<pkgName >的 .d.ts 并自动将路径加入 package.json 的 types 字段, 默认开启 */
  tryInsertTypes?: boolean;
}

const defaultOpts: Partial<Opts> = {
  target: 'auto',
  reformName: {
    type: 'suffix',
    value: '-cjs',
  },
  reformPublicPublish: true,
  reformReadme: 'auto',
  reformKeywords: 'auto',
  tryInsertTypes: true,
};

class Npm2cjs {
  private opts: Opts;
  private originalNpmInfo: NpmInfo;

  constructor(_opts: Opts) {
    this.opts = Object.assign(clone(defaultOpts), _opts);

    this.originalNpmInfo = getOriginalNpmInfo(this.opts.targetDir);
  }

  async generate() {
    const { targetDir, target, outputDir } = this.opts;

    if (isNonStandardNpm(targetDir)) {
      throw simpleError(`<${targetDir}> is non-standard-npm`);
    }

    fs.emptyDirSync(outputDir);

    switch (target) {
      case 'auto': await this.auto2cjs(); break;
      case 'esm': await this.esm2cjs(); break;
      case 'esm_top-level-await': await this.esm_topLevelAwait(); break;
      default: await this.other2cjs(); break;
    }

    await this.reform();
  }

  private async reform() {
    const {
      targetDir,
      outputDir,
      reformName,
      reformPublicPublish,
      reformReadme,
      reformKeywords,
      tryInsertTypes,
    } = this.opts;
    const { originalNpmInfo } = this;
    const readmeFilename = getNpmReadmeFilename(targetDir);

    const originalPkgJson: PackageJson = fs.readJSONSync(path.resolve(targetDir, 'package.json'));
    let pkgJson = clone(originalPkgJson);
    let readme = readmeFilename ? fs.readFileSync(path.resolve(targetDir, readmeFilename)).toString() : null;

    reformBasic();
    reformNameTask();
    reformPublicPublishTask();
    reformReadmeTask();
    reformKeywordTask();
    await reformTypesFile();

    fs.writeJSONSync(path.resolve(outputDir, 'package.json'), pkgJson, { spaces: 2 });
    fs.writeFileSync(path.resolve(outputDir, readmeFilename ?? 'README.md'), readme ?? '');

    function reformBasic() {
      if (pkgJson.type === 'module') {
        pkgJson.type = 'commonjs';
      }
      pkgJson[pkgJson.from ? 'generateFrom' : `generateFrom__timestamp__${Date.now()}`] = 'npm2cjs(https://www.npmjs.com/package/npm2cjs)';
    }

    function reformNameTask() {
      if (!reformName) return;

      let name: string;
      if (typeof reformName === 'function') {
        name = reformName(originalNpmInfo.name);
      } else if (reformName.type) {
        const flatOriginalName = originalNpmInfo.name.replace('@', '__');
        switch (reformName.type) {
          case 'scope': name = `@${reformName.value}/${flatOriginalName}`; break;
          case 'prefix': name = `${reformName.value}${flatOriginalName}`; break;
          case 'suffix': name = `${flatOriginalName}${reformName.value}`; break;
          default: throw simpleError(`❌ 不存在的 reformName.type: ${reformName.type}`);
        }
      } else throw simpleError(`❌ 不存在的 reformName, 请再次校验参数`);

      pkgJson.name = name;
    };

    function reformPublicPublishTask() {
      if (!reformPublicPublish) return;

      pkgJson.publishConfig = {
        access: 'public',
      };
    };

    function reformReadmeTask() {
      if (!reformReadme) return;

      if (typeof reformReadme === 'function') {
        readme = reformReadme(readme);
      } else if (reformReadme === 'auto') {
        const prefix = `\
# ${pkgJson.name}

${logo}

该npm包由 [\`${myPkgJson.name}\`](https://www.npmjs.com/package/${myPkgJson.name}) 转译工具生成.

原npm包: [\`${originalPkgJson.name}\`](https://www.npmjs.com/package/${originalPkgJson.name})

${readme ? '下面为原npm包的README内容' : ''}\n\n`;
        readme = prefix + (readme ?? '');
      } else throw simpleError(`❌ 不存在的 reformReadme, 请再次校验参数`);
    }

    function reformKeywordTask() {
      if (!reformKeywords) return;

      if (Array.isArray(reformKeywords)) {
        pkgJson.keywords = [
          reformKeywords,
          ...pkgJson.keywords,
        ];
      } else {
        pkgJson.keywords = [
          originalPkgJson.name,
          'npm2cjs',
          ...pkgJson.keywords ?? [],
          'cjs',
        ];
      }
    }

    // .d.ts
    async function reformTypesFile() {
      if (
        originalNpmInfo.types ||
        originalNpmInfo.typings ||
        fs.existsSync(path.resolve(targetDir, 'index.d.ts'))
      ) {
        fs.copySync(
          path.resolve(targetDir, originalNpmInfo.types || originalNpmInfo.typings || 'index.d.ts'),
          path.resolve(outputDir, originalNpmInfo.types || originalNpmInfo.typings || 'index.d.ts'),
        );
      } else if (tryInsertTypes) {
        // 尝试下载@types/<pkgName>的.d.ts并自动加入types字段
        const insertTypes = async () => {
          const typesPkgName = `@types/${originalNpmInfo.name.replace('@', '__')}`;
          if (!await validatePkg(typesPkgName, {})) return;
          const tempDir = getTempDir(typesPkgName.replace('/', '_'));
          await npmPull(typesPkgName, {
            outputDir: tempDir,
            // TODO version对应关系???
            tag: 'latest',
          });
          const tempTypesPkgJson: PackageJson = fs.readJSONSync(path.resolve(tempDir, 'package.json'));
          const relativeFilepath = tempTypesPkgJson.types ?? tempTypesPkgJson.typings ?? 'index.d.ts';
          const tempTypesFilepath = path.resolve(tempDir, relativeFilepath);
          const outputTypesFilepath = path.resolve(outputDir, relativeFilepath);
          if (fs.existsSync(outputTypesFilepath)) {
            throw simpleError(`❌ 添加类型文件失败: ${outputTypesFilepath} 已存在.\n如果是手动修改了包目录, 请掉整文件位置, 或者将`);
          }
          fs.copyFileSync(
            tempTypesFilepath,
            outputTypesFilepath,
          );
          pkgJson.types = relativeFilepath;
          pkgJson.typings = relativeFilepath;
        };
        await insertTypes();
      }
    }
  }

  /** 自动识别是esm还是esm_top-level-await */
  private async auto2cjs() {
    await this.esm2cjs.call(this);
  }

  private async esm2cjs() {
    const { originalNpmInfo } = this;
    const { outputDir } = this.opts;

    const productFilepath = path.resolve(outputDir, originalNpmInfo.main ?? 'index.js');
    await compile(originalNpmInfo, productFilepath);
  }

  private async esm_topLevelAwait() {
    throw simpleError(`\n✨✨✨ 目前还不支持<esm_top-level-await>的转换, 但是转换思路已经想好了: <https://juejin.cn/post/7188811856281075767>\n✨✨✨ 快来造轮子, 同时可以联系我: 微信<A1850021148>, github<${myPkgJson.homepage}>`);
  }

  private async other2cjs() {
    throw simpleError(`不存在的<target>参数: ${this.opts.target}, 如果有其它目标代码的需求可以联系作者: <${myPkgJson.bugs.url}>`);
  }
}

const isNonStandardNpm = (npmDir: string) => {
  if (!fs.existsSync(npmDir)) return false;
  if (!fs.existsSync(path.resolve(npmDir, 'package.json'))) return false;
  try {
    const packageJson = fs.readJsonSync(npmDir);
    return packageJson.name && packageJson.version;
  } catch {
    return false;
  }
};

const getOriginalNpmInfo = (npmDir: string): NpmInfo => {
  const packageJson = fs.readJsonSync(path.resolve(npmDir, 'package.json'));
  return {
    ...packageJson,
    dir: npmDir,
  };
};

export { default as compile } from './compile';

export default Npm2cjs;
