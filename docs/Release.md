---
cwd: ../
---

## Capture Changelogs

Package releases are made using Lerna's release capabilities as GitHub workflow and executed by the [technical steering committee](https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md#the-technical-committee) only. All you need to do is go to the [`Manual NPM Publish`](https://github.com/webdriverio/webdriverio/actions/workflows/publish.yml) workflow and trigger a new run. Choose the appropriate version upgrade based on the [Semantic Versioning](https://semver.org/). To help choose the right release type, here are some general guidelines:

- __Breaking Changes__: never do these by yourself! A major release is always a collaborative effort between all TSC members. It requires consensus from all of them.
- __Minor Release__: minor releases are always required if a new, user focused feature was added to one of the packages. For example, if a command was added to WebdriverIO or if a service provides a new form of integration, a minor version bump would be appropriate. However if an internal package like `@wdio/local-runner` exposes a new interface that is solely used internally, we can consider that as a patch release.
- __Patch Release__: every time a bug is fixed, documentation (this includes TypeScript definitions) gets updated or existing functionality is improved, we should do a patch release.

If you are unsure about which release type to pick, reach out in the `webdriverio/TSC` Matrix channel. By setting an NPM tag you can also release a current version with e.g. a `next` tag to test changes before we roll them out to all users.

## Release Process

If a release is triggered, it runs the following procedures:

- *Build the project from scratch*
  ```sh
  npx runme run setup
  ```
- *Published Packages through Lerna*
  ```sh { name=publish }
  npx lerna publish ${{github.event.inputs.releaseType}} --exact --yes --dist-tag ${{github.event.inputs.distTag}}
  ```
- *Pushes Git Tags to GitHub*
  ```sh { name=pushReleaseTag }
  node ./scripts/pushTags.js
  ```

In the `package.json` a hook is set-up to generate changelogs after the version is bumped. For that the project uses a custom script that generates a changelog using [`lerna-changelog`](https://www.npmjs.com/package/lerna-changelog).

```sh { name=createChangelog }
node ./scripts/changelog.js
```
