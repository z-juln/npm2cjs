import os from "os";
import path from "path";
import { spawn } from "child_process";
import fs from "fs-extra";
import Configstore from 'configstore';
import { validatePkg } from '@juln/npm-pkg-version';
import { cac } from "cac";
import TtyTable from "tty-table";
import { npmPull } from "pull-sparse";
import packageJson from '../package.json';
import Npm2cjs, { Opts as Npm2cjsOpts } from "./npm2cjs";
import { getTempDir, simpleError } from "./utils";

const configOptsTable = TtyTable(
  // @ts-ignore
  [{ value: 'key' }, { value: 'value' }, { value: 'description' }],
  [
    { key: 'reformNameType', value: "'scope' | 'prefix' | 'suffix'", description: "转译完包后修改包名, 默认为'suffix'" },
    { key: 'reformNameValue', value: "string", description: "转译完包后修改包名, 默认为'-cjs'" },
    { key: 'reformReadme', value: "'auto' | false", description: "转译完包后是否修改readme, 默认为'auto'" },
    { key: 'reformKeywords', value: "'auto' | false", description: "转译完包后是否追加npm关键词, 默认为'auto'" },
    { key: 'npmRegistry', value: "string", description: "指定发布的npm源, 默认为npm官方源" },
  ],
  [],
  // @ts-ignore
  { headerAlign: 'center' },
).render();

interface ConfigOpts {
  reformNameType: 'scope' | 'prefix' | 'suffix';
  reformNameValue: string;
  reformReadme: 'auto' | false;
  reformKeywords: 'auto' | false;
  npmRegistry: string;
}

const defaultConfigOpts: ConfigOpts = {
  reformNameType: 'suffix',
  reformNameValue: '-cjs',
  reformReadme: 'auto',
  reformKeywords: 'auto',
  npmRegistry: 'https://registry.npmjs.org/',
};

const localStorage = new Configstore(packageJson.name, { config: defaultConfigOpts });

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

const getConfigCli = () => {
  const configCli = cac(`${packageJson.name} config`);
  configCli.command('set <item> [...otherItems]')
    .action((item: string, otherItems: string[] = []) => {
      const appendedConfig = [item, ...otherItems].reduce((cfg, item) => {
        const [key, value] = item.split('=');
        return { ...cfg, [key]: value };
      }, {});
      const oldConfig = localStorage.get('config');
      localStorage.set('config', { ...oldConfig, ...appendedConfig });
    });
  configCli.command('get <key> [...otherKeys]')
    .action((key: string, otherKeys: string[] = []) => {
      const keys = [key, ...otherKeys];
      const config = localStorage.get('config');
      if (keys.length > 1) {
        keys.forEach(key => console.log(`${key}=${config[key]}`));
      } else {
        console.log(config[key]);
      }
    });
  configCli.command('del <key> [...otherKeys]')
    .action((key: string, otherKeys: string[] = []) => {
      const keys = [key, ...otherKeys];
      const config = localStorage.get('config');
      keys.forEach(key => delete config[key]);
      localStorage.set('config', config);
    });
  configCli.command('ls')
    .option('--json', '')
    .action(({ json }) => {
      const config = localStorage.get('config') ?? {};
      if (json) {
        console.log(JSON.stringify(config, null,2));
      } else {
        Object.entries(config).forEach(([key, value]) => console.log(`${key}=${value}`));
      }
    });
  configCli.command('reset')
    .action(() => {
      localStorage.set('config', defaultConfigOpts);
    });
  configCli.help(() => {
    return [
      { body: 'Manage the npm2cjs configuration files' },
      {
        title: 'Usage',
        body: `\
npm2cjs config set <key>=<value> [<key>=<value> ...]
npm2cjs config get [<key> [<key> ...]]
npm2cjs config del <key> [<key> ...]
npm2cjs config ls [--json]
npm2cjs config reset`,
      },
      {
        title: 'ConfigOptions',
        body: configOptsTable,
      },
      { title: 'Options', body: '  -h, --help  Display this message ' }
    ];
  });
  return configCli;
};

const doCli = () => {
  if (process.argv[2] === 'config') {
    const configCli = getConfigCli();
    configCli.parse(process.argv.slice(1));
    return;
  }

  const cli = cac(packageJson.name);
  
  cli.command('do <pkgName>', '将包名为`<pkgName>`的包转换为cjs, 并发布. 也可 npm2cjs do <pkgName@version>')
    .option('-t, --target <target>', "目标代码的类型 'auto' | 'esm' | 'esm_top-level-await'")
    .option('-d, --dist <outputDir>', '将包名为`<pkg-name>`的包转换为cjs, 并保存到`<outputDir>`目录下')
    .option('--no-publish', '是否发布npm, 默认为发布')
    .option('--dry-publish', '发布测试, 即npm publish --dry-run')
    .option('--types, --try-insert-types', '如果package.json中没有指定types(typings)字段, 会尝试拉取@types/<pkgName>并设置types字段', { default: true })
    .action(async (fullPkgName: string, { target, dist: outputDir, publish, dryPublish, types }) => {
      const {
        npmRegistry,
        reformNameType,
        reformNameValue,
        reformReadme,
        reformKeywords,
      } = (localStorage.get('config') ?? {}) as ConfigOpts;
      const [pkgName, version] = fullPkgName.split('@');

      if (!await validatePkg(pkgName, { version: version || undefined, registryUrl: npmRegistry })) {
        throw simpleError(`当前npm源(${npmRegistry})上不存在${fullPkgName}`);
      }

      const originalTmpDir = getTempDir(`${fullPkgName}__original`);
      const outputTmpDir = outputDir ? path.resolve(outputDir) : getTempDir(`${fullPkgName}__output`);

      try {
        await npmPull(pkgName, {
          outputDir: originalTmpDir,
          registryUrl: npmRegistry,
          tag: version || 'latest',
        });
  
        await new Npm2cjs({
          targetDir: originalTmpDir,
          target: target || 'auto',
          outputDir: outputTmpDir,
          reformName: { type: reformNameType, value: reformNameValue },
          reformReadme,
          reformKeywords,
          reformPublicPublish: publish,
          tryInsertTypes: types,
        }).generate();
  
        if (publish) {
          const npmArgs = ['publish', `--registry=${npmRegistry}`];
          if (dryPublish) {
            npmArgs.push('--dry-run');
          }
          const task = () => new Promise(resolve => {
            spawn(
              'npm', npmArgs,
              { cwd: outputTmpDir, stdio: 'inherit' },
            )
              .on('close', resolve)
              .on('error', (err) => {
                throw simpleError(`npm包发布失败: ${err.toString()}`);
              });
          });
          await task();
        }
      } finally {
        const cleanDir = (dir: string) => {
          if (fs.existsSync(dir)) {
            fs.rm(dir, { recursive: true });
          }
        };
        cleanDir(originalTmpDir);
        if (!outputDir) {
          cleanDir(outputTmpDir);
        }
      }
    });

  cli.version(packageJson.version);
  cli.help(sections => {
    const Commands = sections.find(section => section.title === 'Commands');
    const ForMoreInfo = sections.find(section => section.title?.includes('For more info'));
    if (Commands) {
      Commands.body += '\n  config  修改全局配置项';
    }
    if (ForMoreInfo) {
      ForMoreInfo.body += '\n  $ npm2cjs config --help';
    }
    return sections;
  });
  cli.parse();
};

export default doCli;
