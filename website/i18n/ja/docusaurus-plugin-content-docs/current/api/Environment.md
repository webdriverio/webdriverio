---
id: environment
title: Environment Variables
---

WebdriverIO はすべてのワーカーに以下の環境変数を設定します。

## `NODE_ENV`

まだ何か他のものに設定されていない場合は、 `'test'` に設定します。

## `WDIO_LOG_LEVEL`

`trace`、`debug`、`info`、`warn`、`error` の値に設定できます。 `silent` は、対応する詳細を含むログを書き込みます。 渡された `logLevel` の値よりも優先度が高い。

## `WDIO_WORKER_ID`

ワーカープロセスを識別するのに役立つ一意の id です。 `{number}-{number}` の形式で、最初の数値は機能を識別し、2 番目の数値はその機能が実行している仕様ファイルを示します。 `0-5` は、ワーカーが最初の機能に対して 6 番目の仕様ファイルを最初に実行することを示します。
