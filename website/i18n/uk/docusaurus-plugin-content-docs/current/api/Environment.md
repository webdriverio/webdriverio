---
id: environment
title: Змінні середовища
---

WebdriverIO встановлює наступні змінні середовища у кожному worker-процессі:

## `NODE_ENV`

Встановлюється у значенні `'test'` якщо ще не встановлено щось інше.

## `WDIO_LOG_LEVEL`

Може мати значення `trace`, `debug`, `info`, `warn`, `error`, `silent` для запису логів на потрібному рівні деталізації. Має пріоритет над значенням `logLevel`.

## `WDIO_WORKER_ID`

An unique id that helps identify the worker process. It has format of `{number}-{number}` where the first number identifies the capability and the second the spec file that capability is running, e.g. `0-5` indicates a worker the first running the 6th spec file for the first capability.
