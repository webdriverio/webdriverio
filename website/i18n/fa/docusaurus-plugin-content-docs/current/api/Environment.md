---
id: environment
title: متغیرهای محیطی
---

WebdriverIO متغیرهای محیطی زیر را در هر worker تنظیم می کند:

## `NODE_ENV`

اگر قبلاً روی چیز دیگری تنظیم نشده باشد، روی `'test'` تنظیم می شود.

## `WDIO_LOG_LEVEL`

برای نوشتن گزارش‌ها با جزئیات مربوطه می‌توان مقدار را روی `trace`, `debug`, `info`, `warn`, `error`, `silent` تنظیم کرد. این مقدار نسبت به مقدار `logLevel` اولویت دارد.

## `WDIO_WORKER_ID`

یک شناسه منحصر به فرد که به شناسایی worker process کمک می کند. It has format of `{number}-{number}` where the first number identifies the capability and the second the spec file that capability is running, e.g. `0-5` indicates a worker the first running the 6th spec file for the first capability.
