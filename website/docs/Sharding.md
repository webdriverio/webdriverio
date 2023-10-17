---
id: sharding
title: Sharding
---

By default, WebdriverIO runs tests in parallel and strives for optimal utilization of CPU cores on your machine. In order to achieve even greater parallelisation, you can further scale WebdriverIO test execution by running tests on multiple machines simultaneously. We call this mode of operation "sharding".

## Sharding tests between multiple machines

To shard the test suite, pass `--shard=x/y` to the command line. For example, to split the suite into four shards, each running one fourth of the tests:

```sh
npx wdio run wdio.conf.js --shard=1/4
npx wdio run wdio.conf.js --shard=2/4
npx wdio run wdio.conf.js --shard=3/4
npx wdio run wdio.conf.js --shard=4/4
```

Now, if you run these shards in parallel on different computers, your test suite completes four times faster.

## GitHub Actions example

GitHub Actions supports [sharding tests between multiple jobs](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs) using the [`jobs.<job_id>.strategy.matrix`](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix) option. The matrix option will run a separate job for every possible combination of the provided options.

The following example shows you how to configure a job to run your tests on four machines in parallel. You can find the whole pipeline setup in the [Cucumber Boilerplate](https://github.com/webdriverio/cucumber-boilerplate/blob/main/.github/workflows/test.yaml) project.

- First we add a matrix option to our job configuration with the shard option containing the number of shards we want to create. `shard: [1/4, 2/4, 3/4, 4/4]` will create four shards, each with a different shard number.
- Then we run our WebdriverIO tests with the `--shard ${{ matrix.shard }}` option. This will our test command for each shard.
- Finally we upload our wdio log report to the GitHub Actions Artifacts. This will make logs available in case the shard fails.

The test pipeline is defined as follows:

```yaml title=.github/workflows/test.yaml
name: Test

on: [push, pull_request]

jobs:
    lint:
        # ...
    unit:
        # ...
    e2e:
        runs-on: ubuntu-latest
        needs: [lint, unit]
        strategy:
            matrix:
                shard: [1/4, 2/4, 3/4, 4/4]
        steps:
            - uses: actions/checkout@v4
            - uses: ./.github/workflows/actions/setup
            - name: E2E Test
              run: npm run test:features -- --shard ${{ matrix.shard }}
            - uses: actions/upload-artifact@v1
              if: failure()
              with:
                name: logs-${{ matrix.shard }}
                path: logs
```

This will run all shards in parallel, reducing executing time for the tests by 4:

![GitHub Actions example](/img/sharding.png "GitHub Actions example")

See commit [`96d444e`](https://github.com/webdriverio/cucumber-boilerplate/commit/96d444ea23919389682b9b1c9408ed91c452c7f8) from the [Cucumber Boilerplate](https://github.com/webdriverio/cucumber-boilerplate) project that introduced sharding to its test pipeline which helped reduce the overall execution time from [`2:23min`](https://github.com/webdriverio/cucumber-boilerplate/actions/runs/6550905900) down to [`1:30m`](https://github.com/webdriverio/cucumber-boilerplate/actions/runs/6550939542), a reduction of __63%__ 🎉.
