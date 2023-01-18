import os from 'os';
import path from "path";
import { nanoid } from 'nanoid';
import fs from 'fs-extra';
// @ts-ignore
import realPath from 'real-path';

// markdown注入的logo
export const logo = `\
<div align='center'>
	<br/>
	<div style='border: 2px solid yellow; font-size: 20px; width: 60px; height: 60px; line-height: 30px; border-radius: 50%; transform: rotate(45deg);'>
    <span style='position: relative; top: 2px;'>🌈&nbsp;<span style='display: inline-block; transform: rotate(-45deg);'>🌛</span></span>
    <br />
    <span style='position: relative; top: -2px;'><span style='display: inline-block; transform: rotate(-45deg);'>🌞</span>&nbsp;❄️</span>
  </div>
	<br/>
</div>`;

export const simpleError = (errMsg: string, tag = 'Npm2cjs Error') => {
  const err = new Error(errMsg);
  err.stack = '';
  err.name = tag;
  return err;
}

export const getNpmReadmeFilename = (npmDir: string): string | null => {
  try {
    // @ts-ignore
    const p = realPath(path.resolve(npmDir, 'readme.md'));
    console.log('❌p', npmDir, fs.existsSync(p) ? p : null)
    if (!fs.existsSync(p)) return null;
    return path.basename(p);
  } catch {
    return null;
  }
};

export const getTempDir = (name: string) => path.resolve(os.tmpdir(), `${name}__${nanoid()}`);
