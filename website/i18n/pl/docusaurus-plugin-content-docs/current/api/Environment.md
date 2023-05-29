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

Unikalny identyfikator, który pomaga zidentyfikować proces roboczy (worker). Ma format `{number}-{number}`, gdzie pierwsza liczba oznacza ustawione możliwości (capability), a druga plik specyfikacji (spec), który jest wywoływany, np. `0-5` wskazuje proces roboczy, który jako pierwszy uruchamia szósty plik specyfikacji dla pierwszej możliwości.
