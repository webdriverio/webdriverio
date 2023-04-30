---
id: coverage
title: Coverage
---

اجراکننده مرورگر WebdriverIO از گزارش پوشش کد با استفاده از [`istanbul`](https://istanbul.js.org/)پشتیبانی می کند. تست کننده به طور خودکار کد شما را ابزار می کند و پوشش کد را برای شما ضبط می کند.

## تنظیم

برای فعال کردن گزارش پوشش کد، آن را از طریق پیکربندی اجراکننده مرورگر WebdriverIO فعال کنید، به عنوان مثال:

```js title=wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: process.env.WDIO_PRESET,
        coverage: {
            enabled: true
        }
    }],
    // ...
}
```

تمام [گزینه های پوشش](/docs/runner#coverage-options)را بررسی کنید تا نحوه صحیح پیکربندی آن را بیاموزید.

## نادیده گرفتن کد

There may be some sections of your codebase that you wish to purposefully exclude from coverage tracking, to do so you can use the following parsing hints:

- `/* istanbul ignore if */`: ignore the next if statement.
- `/* istanbul ignore else */`: ignore the else portion of an if statement.
- `/* istanbul ignore next */`: ignore the next thing in the source-code ( functions, if statements, classes, you name it).
- `/* istanbul ignore file */`: ignore an entire source-file (this should be placed at the top of the file).

:::info

It is recommended to exclude your test files from the coverage reporting as it could cause errors, e.g. when calling `execute` or `executeAsync` commands. If you like to keep them in your report, ensure your exclude instrumenting them via:

```ts
await browser.execute(/* istanbul ignore next */() => {
    // ...
})
```

:::
