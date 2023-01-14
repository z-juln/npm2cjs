# esm2cjs

esm的npm包转cjs的npm包的cli.

在开发cjs包时, 如果想使用esm包 (如[inquirer最新版本](https://www.npmjs.com/package/inquirer)、[chalk](https://www.npmjs.com/package/chalk)等), 难免需要配置复杂的打包配置来支持. 但也可以另辟蹊径, 用cli的方式自动将这些包转换为cjs包, 并用自己的账户存到npm仓库上. 同时也便于以后的开发.

**注意:** **打包后npm包的README文件会自动加上来源信息, 以表示对原作者产权的尊重**

# Install

`npm i esm2cjs -g` or `yarn global add esm2cjs`

# Usage

### 设置要发布的包的前缀

`esm2cjs config set npm-scope <scope-name>`

如 `esm2cjs config set npm-scope esm2cjs` : 要打包的包名为`chalk`, 发布之后的npm包即为`@esm2cjs/chalk`

### esm to cjs

`esm2cjs do` 直接转换为cjs并发布

`esm2cjs do -d <target-dir> --no-publish` 只转换为cjs并保存到`<target-dir>`目录下, 不发布

### 更多配置使用`esm2cjs -h`查看
