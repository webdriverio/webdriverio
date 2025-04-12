---
id: clock
title: Obiekt zegara (The Clock Object)
---

Możesz modyfikować zegar systemowy przeglądarki za pomocą polecenia [`emulate`](/docs/emulation). Zastępuje ono natywne funkcje globalne związane z czasem, co pozwala na kontrolowanie ich synchronicznie z wykorzystaniem `clock.tick()` lub zwracanego obiektu zegara. Obejmuje to kontrolę nad:

- `setTimeout`
- `clearTimeout`
- `setInterval`
- `clearInterval`
- `obiekty typu Date`

Zegar zaczyna się na początku epoki Uniksa (w zerowym znaczniku czasu). Oznacza to, że po stworzeniu nowej instancji Date, w Twojej aplikacji zegar będzie ustawiony domyślnie na 1 stycznia 1970, jeśli polecenie `emulate` zostało wywołane bez dodatkowych parametrów.

## Przykład

Wraz z wywołaniem `browser.emulate('clock', { ... })` obiekt zegara nadpisze funkcje globalne dla bieżącej strony oraz wszystkich następnych stron, np.:

```ts
const clock = await browser.emulate('clock', { now: new Date(1989, 7, 4) })

console.log(await browser.execute(() => (new Date()).toString()))
// zwraca "Fri Aug 04 1989 00:00:00 GMT-0700 (Pacific Daylight Time)"

await browser.url('https://webdriverio')
console.log(await browser.execute(() => (new Date()).toString()))
// zwraca "Fri Aug 04 1989 00:00:00 GMT-0700 (Pacific Daylight Time)"

await clock.restore()

console.log(await browser.execute(() => (new Date()).toString()))
// zwraca "Thu Aug 01 2024 17:59:59 GMT-0700 (Pacific Daylight Time)"

await browser.url('http://guinea-pig.webdriver.io/pointer.html')
console.log(await browser.execute(() => (new Date()).toString()))
// zwraca "Thu Aug 01 2024 17:59:59 GMT-0700 (Pacific Daylight Time)"
```

Możesz zmodyfikować czas systemowy wywołując [`setSystemTime`](/docs/api/clock/setSystemTime) lub [`tick`](/docs/api/clock/tick).
