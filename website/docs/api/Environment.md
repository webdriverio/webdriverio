---
id: environment
title: Environment Variables
description: Read the environment variables WebdriverIO exposes to each test worker.
---

WebdriverIO sets the following environment variables within every worker:

## `NODE_ENV`

Set to `'test'` if it's not already set to something else.

## `WDIO_LOG_LEVEL`

Can be set to values `trace`, `debug`, `info`, `warn`, `error`, `silent` to write logs with corresponding details. Has priority over the passed `logLevel` value.

## `WDIO_WORKER_ID`

An unique id that helps identify the worker process. It has format of `{number}-{number}` where the first number identifies the capability and the second the spec file that capability is running, e.g. `0-5` indicates a worker the first running the 6th spec file for the first capability.

## `WDIO_SPEC_FILES`

A JSON-encoded array of absolute filesystem paths to the spec files assigned to this worker. It is available during worker setup, including modules loaded through `mochaOpts.require`, without a custom service:

```js title="setup.js"
const specFiles = JSON.parse(process.env.WDIO_SPEC_FILES ?? '[]')
```

For grouped specs, the array contains every file in the group, not just the file currently being evaluated. Each worker receives its own list. File URLs are converted to native filesystem paths in this variable; the runner's original spec selection is unchanged.
