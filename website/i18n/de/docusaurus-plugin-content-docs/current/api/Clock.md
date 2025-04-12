---
id: clock
title: Das Clock-Objekt
---

Sie können die Systemuhr des Browsers mit dem Befehl [`emulate`](/docs/emulation) modifizieren. Dieser überschreibt native globale Funktionen, die mit der Zeit zusammenhängen, und ermöglicht es, sie synchron über `clock.tick()` oder das erzeugte Clock-Objekt zu steuern. Dies umfasst die Kontrolle über:

- `setTimeout`
- `clearTimeout`
- `setInterval`
- `clearInterval`
- `Date Objects`

Die Uhr beginnt beim Unix-Epochenzeitpunkt (Zeitstempel 0). Das bedeutet, wenn Sie in Ihrer Anwendung ein neues Date-Objekt instanziieren, wird es die Zeit vom 1. Januar 1970 haben, sofern Sie keine anderen Optionen für den `emulate`-Befehl angeben.

## Beispiel

Wenn Sie `browser.emulate('clock', { ... })` aufrufen, werden die globalen Funktionen für die aktuelle Seite sowie für alle folgenden Seiten sofort überschrieben, z.B.:

```ts
const clock = await browser.emulate('clock', { now: new Date(1989, 7, 4) })

console.log(await browser.execute(() => (new Date()).toString()))
// returns "Fri Aug 04 1989 00:00:00 GMT-0700 (Pacific Daylight Time)"

await browser.url('https://webdriverio')
console.log(await browser.execute(() => (new Date()).toString()))
// returns "Fri Aug 04 1989 00:00:00 GMT-0700 (Pacific Daylight Time)"

await clock.restore()

console.log(await browser.execute(() => (new Date()).toString()))
// returns "Thu Aug 01 2024 17:59:59 GMT-0700 (Pacific Daylight Time)"

await browser.url('http://guinea-pig.webdriver.io/pointer.html')
console.log(await browser.execute(() => (new Date()).toString()))
// returns "Thu Aug 01 2024 17:59:59 GMT-0700 (Pacific Daylight Time)"
```

Sie können die Systemzeit ändern, indem Sie [`setSystemTime`](/docs/api/clock/setSystemTime) oder [`tick`](/docs/api/clock/tick) aufrufen.
