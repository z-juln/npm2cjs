export const simpleError = (errMsg: string, tag = 'Npm2cjsError') => {
  const err = new Error(errMsg);
  err.stack = '';
  err.name = tag;
  return err;
}
