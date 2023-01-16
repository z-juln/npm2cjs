import os from "os";
import path from "path";
import Configstore from 'configstore';
import packageJson from '../package.json';
import Npm2cjs, { Opts as Npm2cjsOpts } from "./npm2cjs";

const config = new Configstore(packageJson.name);

export interface CliOpts {
  target?: Npm2cjsOpts['target'];
  tempDir?: string;
  npmScope?: string;
  product?: { 
    type?: 'publish' | 'dir';
    opts?: {
      npmRegistry?: string;
      targetDir?: string;
    };
  };
}

const getOpts = (userOpts?: CliOpts): CliOpts => {
  const defaultPublishProductOpts: NonNullable<CliOpts['product']>['opts'] = {
    npmRegistry: 'https://registry.npmjs.org/',
  };
  const defaultDirProductOpts: NonNullable<CliOpts['product']>['opts'] = {
    targetDir: path.resolve('.'),
  };
  const defaultOpts: CliOpts = {
    target: 'auto',
    npmScope: config.get('scope') || 'npm2cjs',
    tempDir: path.resolve(os.tmpdir(), `npm2cjs_${Date.now()}`),
    product: {
      type: 'publish',
      opts: defaultPublishProductOpts,
    },
  };

  const opts: CliOpts = Object.assign(defaultOpts, userOpts);
  if (!opts.product) opts.product = {};
  if (!opts.product?.opts) opts.product.opts = {};
  if (opts.product?.type === 'publish') {
    opts.product.opts = Object.assign(defaultPublishProductOpts, opts.product.opts);
  }
  if (opts.product?.type === 'dir') {
    opts.product.opts = Object.assign(defaultDirProductOpts, opts.product.opts);
  }
  return opts;
};

const cli = (_opts: CliOpts) => {
  const opts = getOpts(_opts);
  const { target, npmScope, tempDir } = opts;
  const { type: productType, opts: productOpts } = opts.product ?? {};

  // new Npm2cjs();
};

export { default as Npm2cjs } from "./npm2cjs";
export { default as compile } from "./compile";

export default cli;
