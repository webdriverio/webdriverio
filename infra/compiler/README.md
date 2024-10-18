# WebdriverIO Build Tool

This sub-package is being used to build WebdriverIO. It uses [Esbuild](https://esbuild.github.io) to bundle the packages.

## Usage

In order to use this package run:

```sh
pnpm -r --filter=@wdio/build run build
```

## Options

You can pass in the following options to customize the build command.

### `-p` / `--project`

With this argument you can specify which sub package in `<root>/packages` will be build. It accepts either the NPM package name or the directory name. If you omit this parameter the tool will try to build all packages. You can pass in one or multiple packages, e.g.

```sh
$ pnpm -r --filter=@wdio/build run build -p webdriverio -p @wdio/logger -p wdio-globals
```

### `--watch`

If you pass in this flag, the build task will run within a "watch" context and will continue to run and rebuild individual changes when changes are being made, e.g.

```sh
# watch changes in logger package
$ pnpm -r --filter=@wdio/build run build -p @wdio/logger --watch
```
