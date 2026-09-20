# Repository Utils

Internal helpers shared by other packages in [`<root>/infra`](https://github.com/webdriverio/webdriverio/tree/main/infra). This package is not published to NPM.

It owns:

- repository constants (`organizationName`, `repoUrl`, …)
- protocol metadata used by `@wdio/compiler` type generation and `@wdio/docs`
- filesystem helpers (`getRootDir`, `getSubPackages`, `buildPreface`)
- downloading files from GitHub (`downloadFromGitHub`)

## Usage

```ts
import { getRootDir, getSubPackages, downloadFromGitHub } from '@wdio/repo-utils'
import { PROTOCOLS, PROTOCOL_NAMES } from '@wdio/repo-utils/protocols'
import { repoUrl } from '@wdio/repo-utils/constants'
```
