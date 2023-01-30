# npm2cjs

<div align='center'>
	<br/>
	<div style='border: 2px solid yellow; font-size: 20px; width: 60px; height: 60px; line-height: 30px; border-radius: 50%; transform: rotate(45deg);'>
    <span style='position: relative; top: 2px;'>🌈&nbsp;<span style='display: inline-block; transform: rotate(-45deg);'>🌛</span></span>
    <br />
    <span style='position: relative; top: -2px;'><span style='display: inline-block; transform: rotate(-45deg);'>🌞</span>&nbsp;❄️</span>
  </div>
	<br/>
</div>

将常见的其它格式的npm包转成cjs的npm包的cli.

在开发cjs包时, 如果想使用esm包 (如[inquirer最新版本](https://www.npmjs.com/package/inquirer)、[chalk](https://www.npmjs.com/package/chalk)等), 难免需要配置复杂的打包配置来支持. 但也可以另辟蹊径, 用cli的方式自动将这些包转换为cjs包, 并用自己的账户存到npm仓库上. 同时也便于以后的开发.

**注意:** **打包后npm包的README文件会自动加上来源信息, 以表示对原作者产权的尊重**

# Install

`npm i npm2cjs -g` or `yarn global add npm2cjs`

# Usage

### 设置要发布的包的包名

`npm2cjs config set reformNameType=suffix reformNameValue=-cjs` 给包名添加`-cjs`的后缀, 如: 要打包的包名为`chalk`, 发布之后的npm包即为`chalk-cjs`

更多配置项请使用`npm2cjs config -h`查看

### npm to cjs

`npm2cjs do <pkg-name>` 将包名为`<pkg-name>`的包转换为cjs, 并发布

也可 `npm2cjs do <pkg-name@version>`

`npm2cjs do <pkg-name> -d <output-dir> --no-publish` 将包名为`<pkg-name>`的包转换为cjs, 并保存到`<output-dir>`目录下, 不发布

### 更多配置

请使用`npm2cjs -h`查看

# 两个问题尚未解决

1. 目标包不能用`top-level-await`, babel不会解析`top-level-await`且直接保留代码, webpack解析`top-level-await`会有bug. 需要单独的解析器(详细看文章[mjs转译为cjs(快来造轮子)](https://juejin.cn/post/7188811856281075767)), 尚未开始开发, 欢迎一起搞

2. 不支持多个入口文件, 目前是只打算支持一个入口文件的转换

3. 不支持多个导出文件, 功能尚未完成
