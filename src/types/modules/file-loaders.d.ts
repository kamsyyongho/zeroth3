/**
 * used to get the pathname for importing web workers
 */
declare module 'file-loader?name=[name].js!*' {
  const value: string;
  export = value;
}
