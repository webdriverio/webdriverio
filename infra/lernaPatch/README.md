# Lerna Patch

This sub-package is being used to patch Lerna to not run `pnpm install` after it prepared all packages for release. It does that as part of the `version` command:

```ts
    if (this.options.npmClient === "pnpm") {
      this.logger.verbose("version", "Updating root pnpm-lock.yaml");
      await execPackageManager(
        "pnpm",
        [
          "install",
          "--lockfile-only",
          !runScriptsOnLockfileUpdate ? "--ignore-scripts" : "",
          ...npmClientArgs,
        ].filter(Boolean),
        this.execOpts
      );

      const lockfilePath = path.join(this.project.rootPath, "pnpm-lock.yaml");
      changedFiles.add(lockfilePath);
    }
```

Which would fail during the release as WebdriverIO dependencies would reference the new WebdriverIO version which would not be installed at that point, causing this error:

```
lerna ERR! /home/runner/work/webdriverio/webdriverio/packages/wdio-globals:
lerna ERR!  ERR_PNPM_NO_MATCHING_VERSION  No matching version found for @wdio/logger@9.0.0
lerna ERR!
lerna ERR! This error happened while installing a direct dependency of /home/runner/work/webdriverio/webdriverio/packages/wdio-globals
lerna ERR!
lerna ERR! The latest release of @wdio/logger is "8.38.0".
lerna ERR!
lerna ERR! Other releases are:
lerna ERR!   * beta: 7.0.0-beta.1
lerna ERR!   * v9: 9.0.0-alpha.0
lerna ERR!   * next: 9.0.0-alpha.426
lerna ERR!
lerna ERR! If you need the full list of all 123 published versions run "$ pnpm view @wdio/logger versions".
lerna ERR!     at makeError (/home/runner/work/webdriverio/webdriverio/node_modules/.pnpm/execa@5.0.0/node_modules/execa/lib/error.js:59:11)
lerna ERR!     at handlePromise (/home/runner/work/webdriverio/webdriverio/node_modules/.pnpm/execa@5.0.0/node_modules/execa/index.js:114:26)
lerna ERR!     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
lerna ERR!     at async VersionCommand.updatePackageVersions (/home/runner/work/webdriverio/webdriverio/node_modules/.pnpm/lerna@8.1.8_@swc+core@1.7.10_encoding@0.1.13/node_modules/lerna/dist/index.js:9857:11)
lerna ERR!     at async Promise.all (index 0)
lerna ERR! Error: Command failed with exit code 1: pnpm install --lockfile-only --ignore-scripts
```

You can call this package via:

```sh
$ pnpm -r --filter=@wdio/lerna-patch run patch
```
