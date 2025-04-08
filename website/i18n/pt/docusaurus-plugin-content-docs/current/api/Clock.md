---
id: clock
title: The Clock Object
---

Você pode modificar o relógio do sistema do navegador usando o comando [`emulate`](/docs/emulation). Ele substitui funções globais nativas relacionadas ao tempo, permitindo que elas sejam controladas de forma síncrona via `clock.tick()` ou pelo objeto de relógio gerado. Isso inclui controlar:

- `setTimeout`
- `clearTimeout`
- `setInterval`
- `clearInterval`
- `Date Objects`

O relógio começa na época unix (carimbo de data/hora 0). Isso significa que quando você instanciar uma nova Data em seu aplicativo, ela terá o horário de 1º de janeiro de 1970 se você não passar nenhuma outra opção para o comando `emulate`.

## Exemplo

Ao chamar `browser.emulate('clock', { ... })` ele substituirá imediatamente as funções globais da página atual, bem como de todas as páginas seguintes, por exemplo:

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
// retorna "Thu Aug 01 2024 17:59:59 GMT-0700 (Pacific Daylight Time)"
```

Você pode modificar a hora do sistema chamando [`setSystemTime`](/docs/api/clock/setSystemTime) ou [`tick`](/docs/api/clock/tick).
