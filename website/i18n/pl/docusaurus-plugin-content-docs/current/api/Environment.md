---
id: environment
title: Zmienne środowiskowe
---

WebdriverIO ustawia następujące zmienne środowiskowe w ramach każdego procesu roboczego (workera):

## `NODE_ENV`

Domyślnie `'test'` jeżeli nie jest ustawiona inna wartość.

## `WDIO_LOG_LEVEL`

Aby ustawić odpowiedni poziom szczegółowości logów, dostępne są następujące wartości: `trace`, `debug`, `info`, `warn`, `error`, `silent`. Ta zmienna środowiskowa ma priorytet nad wartością przekazaną w ramach `logLevel`.

## `WDIO_WORKER_ID`

Unikalny identyfikator, który pomaga zidentyfikować proces roboczy (worker). It has format of `{number}-{number}` where the first number identifies the capability and the second the spec file that capability is running, e.g. `0-5` indicates a worker the first running the 6th spec file for the first capability.
