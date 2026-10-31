---
id: githubactions
title: Github Actions
description: "Run your WebdriverIO tests on GitHub Actions by adding a workflow file to your repository."
---

If your repository is hosted on Github, you can use [Github Actions](https://docs.github.com/en/actions) to run your tests on Github's infrastructure.

1. every time you push changes
2. on every pull request creation
3. on scheduled time
4. by manual trigger

In the root of your repository, create a `.github/workflows` directory. Add a Yaml file, for example `.github/workflows/ci.yaml`. In there you will configure how to run your tests.

See [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) for reference implementation, and [sample test runs](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Find out in the [Github Docs](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow?tool=cli) on more information about creating workflow files.

## Firefox on Windows runners

On a GitHub-hosted Windows runner, Geckodriver creates each temporary Firefox profile in `%TEMP%`, which is on the `C:` system disk. When several Firefox sessions start at the same time, their profiles fill the disk queue of `C:`. The running Firefox sessions then stop answering for 5 to 20 seconds while they start their content processes, and tests time out.

Create the profiles on `D:` instead: set the Geckodriver option `profileRoot` to `RUNNER_TEMP`, the temporary folder that GitHub Actions sets in every job. On GitHub-hosted Windows runners it is on `D:`; on a self-hosted runner, check that it is on a different disk than the system disk.

```ts title="wdio.conf.ts"
import os from 'node:os'

const profileRoot = os.platform() === 'win32' ? process.env.RUNNER_TEMP : undefined

export const config: WebdriverIO.Config = {
    // ...
    maxInstances: 4,
    capabilities: [{
        browserName: 'firefox',
        'moz:firefoxOptions': { args: ['-headless'] },
        ...(profileRoot ? { 'wdio:geckodriverOptions': { profileRoot } } : {})
    }]
}
```

Geckodriver still deletes each profile when the session ends. Outside of GitHub Actions, `RUNNER_TEMP` is not set and the profiles stay in the default folder.

Measured on `windows-latest` (2 cores), with up to 4 Chrome and Firefox sessions at the same time, 10 jobs each:

| Profiles in | Firefox stalls of 5 s or more | Session start (`POST /session`), median / max |
|---|---|---|
| `%TEMP%` on `C:` (default) | 14, in 7 of 10 jobs | 7.3 s / 36.0 s |
| `RUNNER_TEMP` on `D:` | 0 | 2.3 s / 13.0 s |
