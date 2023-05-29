export interface PackageJson {
  name: string;
  version: string;
  main?: string;
  module?: string;
  types?: string;
  typings?: string;
  files?: string[];
  [K: string]: any;
}

export interface NpmInfo extends PackageJson {
  dir: string;
}
