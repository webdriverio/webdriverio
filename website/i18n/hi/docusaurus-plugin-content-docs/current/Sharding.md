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
