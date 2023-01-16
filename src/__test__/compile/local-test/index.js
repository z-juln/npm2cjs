import path from 'node:path';
import fs from 'fs';
import b from './b';
import json from './json.json';
import open from 'open';
import chalk from 'chalk';

open('https://sindresorhus.com').then(() => {
  console.log('open success');
}).catch(() => {
  console.log('open fail');
});
chalk.level = 1;
console.log(chalk.bgBlue(json.test, b));

export { default as a } from './a.js';
