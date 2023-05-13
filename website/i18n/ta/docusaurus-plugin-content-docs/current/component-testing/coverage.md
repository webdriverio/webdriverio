---
id: coverage
title: கவரேஜ்
---

WebdriverIO இன் பிரௌசர் ரன்னர் [` istanbul `](https://istanbul.js.org/)ஐப் பயன்படுத்தி கோடு கவரேஜ் அறிக்கையிடலை ஆதரிக்கிறது. டெஸ்ட்ரன்னர் தானாகவே உங்கள் கோடை கருவி செய்து, உங்களுக்காக கோடு கவரேஜை கைப்பற்றும்.

## செட்அப்

கோடு கவரேஜ் அறிக்கையிடலை இயக்க, WebdriverIO பிரௌசர் ரன்னர் கான்பிகரேஷன் மூலம் அதை இயக்கவும், எ.கா.:

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

அனைத்து [coverage options](/docs/runner#coverage-options)ஐப் பார்க்கவும், அதை எவ்வாறு சரியாகக் கட்டமைப்பது என்பதை அறிய.

## கோடை புறக்கணித்தல்

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
