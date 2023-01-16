import { simpleError } from './utils';
import fs from 'fs-extra';
import packageJson from '../package.json';
import { NpmInfo, PackageJson } from './interface';

export interface Opts {
  target?: 'auto' | 'esm' | 'esm_top-level-await' | (string & {});
}

class Npm2cjs {
  opts: Opts;
  originalNpmInfo: NpmInfo;

  constructor(targetDir: string, _opts: Opts = {}) {
    this.opts = Object.assign({
      target: 'auto',
    }, _opts);
    const { target } = this.opts;

    switch (target) {
      case 'auto':
        this.auto2cjs();
        break;
      case 'esm':
        this.esm2cjs();
        break;
      case 'esm_top-level-await':
        this.esm_topLevelAwait();
      default:
        this.other2cjs();
    }

    if (isNonStandardNpm(targetDir)) {
      throw simpleError(`<${targetDir}> is non-standard-npm`);
    }

    this.originalNpmInfo = getOriginalNpmInfo(targetDir);
  }

  auto2cjs() {
    this.esm2cjs.call(this);
  }

  esm2cjs() {

  }

  esm_topLevelAwait() {
    throw simpleError(`\n✨✨✨ 目前还不支持<esm_top-level-await>的转换, 但是转换思路已经想好了: <https://juejin.cn/post/7188811856281075767>\n✨✨✨ 快来造轮子, 同时可以联系我: 微信<A1850021148>, github<${packageJson.homepage}>`);
  }

  other2cjs() {
    throw simpleError(`不存在的<target>参数: ${this.opts.target}, 如果有其它目标代码的需求可以联系作者: <${packageJson.bugs.url}>`);
  }
}

const isNonStandardNpm = (npmDir: string) => {
  const packageJson = fs.readJsonSync(npmDir);
  return packageJson.name && packageJson.version && packageJson.main;
};

const getOriginalNpmInfo = (npmDir: string): NpmInfo => {
  const packageJson = fs.readJsonSync(npmDir);
  return {
    ...packageJson,
    dir: npmDir,
  };
};

export default Npm2cjs;
