---
cwd: ../
---

# Development

There are different workflows you might use during the development of WebdriverIO.

## Watch File Changes

If you work on WebdriverIO code, you want to have the build script constantly running in watch mode so it recompiled the TypeScript files automatically. You can kick this of via:

```sh { name=watch }
node ./scripts/build.js --watch
```

If you only work on a single package, you can watch only for that one by calling:

```sh
$ node ./scripts/build.js <package-name>
# or watch file changes of a particular package
$ node ./scripts/build.js <package-name> --watch
```

## Test Changes

For the development on the WebdriverIO code base you can use examples files that have been created by the maintainers in the [examples directory](https://github.com/webdriverio/webdriverio/tree/main/examples). They cover various use cases and are setup so that they a run with the code from the repository. Let's say you make changes to the WDIO testrunner and want to see if they are applied correctly you can just run the testrunner examples by calling:

```sh
cd ./examples/wdio
$ npm run test:mocha
```

This will run a simple test suite using the testrunner with Mochajs. There are similar examples for other frameworks, custom services and reporters as well as using the devtools protocol as the automation engine. Feel free to add examples if they help testing features you are working on.

## Create New Package

All WebdriverIO sub packages require a certain structure to work within the wdio ecosystem. To simplify the process of creating a new sub package, we built an NPM script that does all the boilerplate work for you. Just run:

```sh { name=create }
node ./scripts/generateSubPackage.js
```

It will ask you about the type and name of the new package and create all the files for you.

## Back-Porting Bug Fixes

Starting from v6 the WebdriverIO team tries to backport all features that would be still backwards compatible with older versions. The team tries to release a new major version every year (usually around December/January). With a new major version update (e.g. v7) we continue to maintain the last version (e.g. v6) and deprecate the previous maintained version (e.g. v5, v4 and lower). With that the team commits to always support 2 major versions.

### As a Triager

Everyone triaging or reviewing a PR should label it with `backport-requested` if the changes can be applied to the maintained (previous) version. Generally every PR that would not be a breaking change for the previous version should be considered to be ported back. If a change relies on features or code pieces that are only available in the current version, then a back port can still be considered if you feel comfortable making the necessary adjustments. That said, don't feel forced to back port code if the time investment and complexity is too high. Backporting functionality is a reasonable contribution that can be made by any contributor.

### As a Merger

Once a PR with a `backport-requested` label got merged, you are responsible for backporting the patch to the older version. To do so, pull the latest code from GitHub:

```sh
git pull
$ git fetch --all
$ git checkout v6
```

Before you can start, please export an `GITHUB_AUTH` token into your environment in order to allow the executing script to fetch data about pull requests and set proper labels. Go to your [personal access token](https://github.com/settings/tokens) settings page and generate such a token with only having the `public_repo` field enabled. Then export it into your environment and run the backport script. It fetches all commits connected with PRs that are labeled with `backport-requested` and cherry-picks them into the maintenance branch. Via an interactive console you can get the chance to review the PR again and whether you want to backport it or not. To start the process, just execute:

```sh { name=backport }
node ./scripts/backport.js
```

If during the process a cherry-pick fails, you can always abort and manually troubleshoot. If you are not able to resolve the problem, create an issue in the repo and include the author of that PR. A successful backport of two PRs will look like this:

```
$ npm run backport

> webdriverio-monorepo@ backport /path/to/webdriverio/webdriverio
> node ./scripts/backport.js

? You want to backport "Backporting Test PR" by christian-bromann?
(See PR https://github.com/webdriverio/webdriverio/pull/4890) Yes
Backporting sha 264b7bc49dfc3fe8f1ed8b58d681ce562aaf1544 from v6 to v5
[cb-backport-process e47c5527] Backporting Test PR (#4890)
 Author: Christian Bromann <mail@christian-bromann.com>
 Date: Mon Dec 16 14:54:02 2019 +0100
 1 file changed, 2 insertions(+)
? You want to backport "Second backport test" by christian-bromann?
(See PR https://github.com/webdriverio/webdriverio/pull/4891) Yes
Backporting sha 77dc52fdb86c51242b92f299998d2904004cb347 from v6 to v5
[cb-backport-process 35a3ad41] Second backport test (#4891)
 Author: Christian Bromann <mail@christian-bromann.com>
 Date: Mon Dec 16 16:01:46 2019 +0100
 1 file changed, 2 deletions(-)

Successfully backported 2 PRs 👏!
Please now push them to `v6` and make a new v6.x release!
```

You can always reach out to the `webdriverio/ProjectCommitters` channel on Matrix for questions.
