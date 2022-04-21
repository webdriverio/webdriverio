// These types are extracted from `ts-node` (`dist/index.d.ts`) to avoid the dependendy on `ts-node`
// Copyright (c) 2014 Blake Embrey (hello@blakeembrey.com)
// Licsense: MIT

import type * as _ts from 'typescript'
export type ModuleTypes = Record<string, 'cjs' | 'esm' | 'package'>

interface CreateOptions {
  /**
   * Behave as if invoked within this working directory.  Roughly equivalent to `cd $dir && ts-node ...`
   *
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Legacy alias for `cwd`
   *
   * @deprecated use `projectSearchDir` or `cwd`
   */
  dir?: string;
  /**
   * Emit output files into `.ts-node` directory.
   *
   * @default false
   */
  emit?: boolean;
  /**
   * Scope compiler to files within `scopeDir`.
   *
   * @default false
   */
  scope?: boolean;
  /**
   * @default First of: `tsconfig.json` "rootDir" if specified, directory containing `tsconfig.json`, or cwd if no `tsconfig.json` is loaded.
   */
  scopeDir?: string;
  /**
   * Use pretty diagnostic formatter.
   *
   * @default false
   */
  pretty?: boolean;
  /**
   * Use TypeScript's faster `transpileModule`.
   *
   * @default false
   */
  transpileOnly?: boolean;
  /**
   * **DEPRECATED** Specify type-check is enabled (e.g. `transpileOnly == false`).
   *
   * @default true
   */
  typeCheck?: boolean;
  /**
   * Use TypeScript's compiler host API instead of the language service API.
   *
   * @default false
   */
  compilerHost?: boolean;
  /**
   * Logs TypeScript errors to stderr instead of throwing exceptions.
   *
   * @default false
   */
  logError?: boolean;
  /**
   * Load "files" and "include" from `tsconfig.json` on startup.
   *
   * Default is to override `tsconfig.json` "files" and "include" to only include the entrypoint script.
   *
   * @default false
   */
  files?: boolean;
  /**
   * Specify a custom TypeScript compiler.
   *
   * @default "typescript"
   */
  compiler?: string;
  /**
   * Specify a custom transpiler for use with transpileOnly
   */
  transpiler?: string | [string, object];
  /**
   * Transpile with swc instead of the TypeScript compiler, and skip typechecking.
   *
   * Equivalent to setting both `transpileOnly: true` and `transpiler: 'ts-node/transpilers/swc'`
   *
   * For complete instructions: https://typestrong.org/ts-node/docs/transpilers
   */
  swc?: boolean;
  /**
   * Paths which should not be compiled.
   *
   * Each string in the array is converted to a regular expression via `new RegExp()` and tested against source paths prior to compilation.
   *
   * Source paths are normalized to posix-style separators, relative to the directory containing `tsconfig.json` or to cwd if no `tsconfig.json` is loaded.
   *
   * Default is to ignore all node_modules subdirectories.
   *
   * @default ["(?:^|/)node_modules/"]
   */
  ignore?: string[];
  /**
   * Path to TypeScript config file or directory containing a `tsconfig.json`.
   * Similar to the `tsc --project` flag: https://www.typescriptlang.org/docs/handbook/compiler-options.html
   */
  project?: string;
  /**
   * Search for TypeScript config file (`tsconfig.json`) in this or parent directories.
   */
  projectSearchDir?: string;
  /**
   * Skip project config resolution and loading.
   *
   * @default false
   */
  skipProject?: boolean;
  /**
   * Skip ignore check, so that compilation will be attempted for all files with matching extensions.
   *
   * @default false
   */
  skipIgnore?: boolean;
  /**
   * JSON object to merge with TypeScript `compilerOptions`.
   *
   * @allOf [{"$ref": "https://schemastore.azurewebsites.net/schemas/json/tsconfig.json#definitions/compilerOptionsDefinition/properties/compilerOptions"}]
   */
  compilerOptions?: object;
  /**
   * Ignore TypeScript warnings by diagnostic code.
   */
  ignoreDiagnostics?: Array<number | string>;
  /**
   * Modules to require, like node's `--require` flag.
   *
   * If specified in `tsconfig.json`, the modules will be resolved relative to the `tsconfig.json` file.
   *
   * If specified programmatically, each input string should be pre-resolved to an absolute path for
   * best results.
   */
  require?: Array<string>;
  readFile?: (path: string) => string | undefined;
  fileExists?: (path: string) => boolean;
  transformers?: _ts.CustomTransformers | ((p: _ts.Program) => _ts.CustomTransformers);
  /**
   * Allows the usage of top level await in REPL.
   *
   * Uses node's implementation which accomplishes this with an AST syntax transformation.
   *
   * Enabled by default when tsconfig target is es2018 or above. Set to false to disable.
   *
   * **Note**: setting to `true` when tsconfig target is too low will throw an Error.  Leave as `undefined`
   * to get default, automatic behavior.
   */
  experimentalReplAwait?: boolean;
  /**
   * Override certain paths to be compiled and executed as CommonJS or ECMAScript modules.
   * When overridden, the tsconfig "module" and package.json "type" fields are overridden.
   * This is useful because TypeScript files cannot use the .cjs nor .mjs file extensions;
   * it achieves the same effect.
   *
   * Each key is a glob pattern following the same rules as tsconfig's "include" array.
   * When multiple patterns match the same file, the last pattern takes precedence.
   *
   * `cjs` overrides matches files to compile and execute as CommonJS.
   * `esm` overrides matches files to compile and execute as native ECMAScript modules.
   * `package` overrides either of the above to default behavior, which obeys package.json "type" and
   * tsconfig.json "module" options.
   */
  moduleTypes?: ModuleTypes;
  /**
   * A function to collect trace messages from the TypeScript compiler, for example when `traceResolution` is enabled.
   *
   * @default console.log
   */
  tsTrace?: (str: string) => void;
}

/**
 * Options for registering a TypeScript compiler instance globally.
 */
export interface RegisterOptions extends CreateOptions {
  /**
   * Re-order file extensions so that TypeScript imports are preferred.
   *
   * For example, when both `index.js` and `index.ts` exist, enabling this option causes `require('./index')` to resolve to `index.ts` instead of `index.js`
   *
   * @default false
   */
  preferTsExts?: boolean;
  /**
   * Enable experimental features that re-map imports and require calls to support:
   * `baseUrl`, `paths`, `rootDirs`, `.js` to `.ts` file extension mappings,
   * `outDir` to `rootDir` mappings for composite projects and monorepos.
   *
   * For details, see https://github.com/TypeStrong/ts-node/issues/1514
   */
  experimentalResolverFeatures?: boolean;
}
