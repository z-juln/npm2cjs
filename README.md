# esm2cjs

将常见的其它格式的npm包转成cjs的npm包的cli.

在开发cjs包时, 如果想使用esm包 (如[inquirer最新版本](https://www.npmjs.com/package/inquirer)、[chalk](https://www.npmjs.com/package/chalk)等), 难免需要配置复杂的打包配置来支持. 但也可以另辟蹊径, 用cli的方式自动将这些包转换为cjs包, 并用自己的账户存到npm仓库上. 同时也便于以后的开发.

**注意:** **打包后npm包的README文件会自动加上来源信息, 以表示对原作者产权的尊重**

# Install

`npm i npm2cjs -g` or `yarn global add npm2cjs`

# Usage

### 设置要发布的包的前缀

`npm2cjs config set npm-scope <scope-name>`

如 `npm2cjs config set npm-scope npm2cjs` : 要打包的包名为`chalk`, 发布之后的npm包即为`@npm2cjs/chalk`

### npm to cjs

`npm2cjs do <pkg-name>` 将包名为`<pkg-name>`的包转换为cjs, 并发布

`npm2cjs do <pkg-name> -d <target-dir> --no-publish` 只将包名为`<pkg-name>`的包转换为cjs, 并保存到`<target-dir>`目录下, 不发布

### 更多配置

请使用`npm2cjs -h`查看

# 两个问题无法解决

1. 目标包不能用`top-level-await`, babel不会解析`top-level-await`且直接保留代码, webpack解析`top-level-await`会有bug
