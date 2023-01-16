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
