---
id: environment
title: متغیرهای محیطی
---

WebdriverIO متغیرهای محیطی زیر را در هر worker تنظیم می کند:

## `NODE_ENV`

Set to `'test'` if it's not already set to something else.

## `WDIO_LOG_LEVEL`

Can be set to values `trace`, `debug`, `info`, `warn`, `error`, `silent` to write logs with corresponding details. Has priority over the passed `logLevel` value.

## `WDIO_WORKER_ID`

An unique id that helps identify the worker process. It has format of `{number}-{number}` where the first number identifies the capability and the second the spec file that capability is running, e.g. `0-5` indicates a worker the first running the 6th spec file for the first capability.
