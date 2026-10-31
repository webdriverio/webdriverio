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

By default, Geckodriver creates each temporary Firefox profile in `%TEMP%`, on the `C:` system disk. On a GitHub-hosted Windows runner, several Firefox sessions that start at the same time fill the disk queue of `C:`. The running Firefox sessions then stop answering for 5 to 20 seconds, and tests time out.

When WebdriverIO starts Geckodriver on Windows in GitHub Actions (`RUNNER_TEMP` is set), it creates the Firefox profiles in `RUNNER_TEMP`, which is on `D:` on GitHub-hosted runners. Geckodriver still deletes each profile when the session ends. A `profileRoot` that you set always wins. To keep the profiles in `%TEMP%`:

```ts title="wdio.conf.ts"
import os from 'node:os'

export const config: WebdriverIO.Config = {
    // ...
    capabilities: [{
        browserName: 'firefox',
        'wdio:geckodriverOptions': { profileRoot: os.tmpdir() }
    }]
}
```

Measured on `windows-latest` (Windows Server 2025, 2 cores, 4 logical processors), with up to 4 Chrome and Firefox sessions at the same time, 10 jobs each:

| Profiles in | Firefox stalls of 5 s or more | Session start (`POST /session`), median / max |
|---|---|---|
| `%TEMP%` on `C:` | 14, in 7 of 10 jobs | 7.3 s / 36.0 s |
| `RUNNER_TEMP` on `D:` | 0 | 2.3 s / 13.0 s |

Other CI systems do not set `RUNNER_TEMP`, so the profiles stay in `%TEMP%`. If you see the same stalls there, set `profileRoot` to a folder on a disk that is not the system disk:

| CI system | Default in WebdriverIO | Temporary folder of the CI |
|---|---|---|
| GitHub Actions, GitHub-hosted | profiles in `RUNNER_TEMP` (`D:`) | `RUNNER_TEMP` |
| GitHub Actions, self-hosted | profiles in `RUNNER_TEMP` (check that it is not on the system disk) | `RUNNER_TEMP` |
| Azure Pipelines | `%TEMP%` (not measured) | `AGENT_TEMPDIRECTORY` |
| Jenkins | `%TEMP%` | `WORKSPACE_TMP` |
| Other CI systems | `%TEMP%` | — |
