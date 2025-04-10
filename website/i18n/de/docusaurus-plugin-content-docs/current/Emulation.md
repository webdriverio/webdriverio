---
id: emulation
title: Emulation
---

Mit WebdriverIO können Sie Web-APIs mithilfe des [`emulate`](/docs/api/browser/emulate)-Befehls emulieren, um benutzerdefinierte Werte zurückzugeben, die Ihnen bei der Emulation bestimmter Browser-Verhaltensweisen helfen. Beachten Sie, dass Ihre Anwendung diese APIs explizit verwenden muss.

<LiteYouTubeEmbed
 id="2bQXzIB_97M"
 title="WebdriverIO Tutorials: The Emulate Command - Emulate Web APIs at Runtime with WebdriverIO"
/>

:::info

Diese Funktion erfordert WebDriver Bidi-Unterstützung für den Browser. Während neuere Versionen von Chrome, Edge und Firefox diese Unterstützung haben, unterstützt Safari dies **nicht**. Für Updates folgen Sie [wpt.fyi](https://wpt.fyi/results/webdriver/tests/bidi/script/add_preload_script/add_preload_script.py?label=experimental\&label=master\&aligned). Darüber hinaus, wenn Sie einen Cloud-Anbieter zum Starten von Browsern verwenden, stellen Sie sicher, dass Ihr Anbieter auch WebDriver Bidi unterstützt.

Um WebDriver Bidi für Ihren Test zu aktivieren, stellen Sie sicher, dass in Ihren Capabilities `webSocketUrl: true` eingestellt ist.

:::

## Geolocation

Ändern Sie die Browser-Geolokalisierung für einen bestimmten Bereich, z.B.:

```ts
await browser.emulate('geolocation', {
    latitude: 52.52,
    longitude: 13.39,
    accuracy: 100
})
await browser.url('https://www.google.com/maps')
await browser.$('aria/Show Your Location').click()
await browser.pause(5000)
console.log(await browser.getUrl()) // outputs: "https://www.google.com/maps/@52.52,13.39,16z?entry=ttu"
```

Dies patcht, wie [`navigator.geolocation.getCurrentPosition`](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) funktioniert und gibt den von Ihnen angegebenen Standort zurück.

## Farbschema

Ändern Sie die Standardeinstellung des Farbschemas des Browsers über:

```ts
await browser.emulate('colorScheme', 'light')
await browser.url('https://webdriver.io')
const backgroundColor = await browser.$('nav').getCSSProperty('background-color')
console.log(backgroundColor.parsed.hex) // outputs: "#efefef"

await browser.emulate('colorScheme', 'dark')
await browser.url('https://webdriver.io')
const backgroundColor = await browser.$('nav').getCSSProperty('background-color')
console.log(backgroundColor.parsed.hex) // outputs: "#000000"
```

Dies patcht, wie sich [`window.matchMedia`](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) verhält, wenn Sie das Farbschema über `(prefers-color-scheme: dark)` abfragen.

## User Agent

Ändern Sie den User Agent des Browsers zu einem anderen String über:

```ts
await browser.emulate('userAgent', 'Chrome/1.2.3.4 Safari/537.36')
```

Dies ändert den Wert von [`navigator.userAgent`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent). Beachten Sie, dass Browser-Anbieter den User Agent schrittweise außer Betrieb nehmen.

## onLine Eigenschaft

Ändern Sie den Online-Status des Browsers über:

```ts
await browser.emulate('onLine', false)
```

Dies schaltet **nicht** den Netzwerkverkehr zwischen dem Browser und dem Internet ab und ändert nur den Rückgabewert von [`navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine). Wenn Sie daran interessiert sind, die Netzwerkfähigkeiten des Browsers zu modifizieren, schauen Sie sich den [`throttleNetwork`](/docs/api/browser/throttleNetwork)-Befehl an.

## Uhr

Sie können die Systemuhr des Browsers mit dem [`emulate`](/docs/emulation)-Befehl ändern. Dieser überschreibt native globale Funktionen, die mit der Zeit zusammenhängen, und ermöglicht es, sie synchron über `clock.tick()` oder das erzeugte Uhr-Objekt zu steuern. Dies umfasst die Kontrolle von:

- `setTimeout`
- `clearTimeout`
- `setInterval`
- `clearInterval`
- `Date Objects`

Die Uhr beginnt mit der Unix-Epoche (Zeitstempel 0). Das bedeutet, wenn Sie in Ihrer Anwendung ein neues Date-Objekt instanziieren, wird es den Zeitpunkt 1. Januar 1970 haben, falls Sie keine anderen Optionen an den `emulate`-Befehl übergeben.

##### Beispiel

Wenn Sie `browser.emulate('clock', { ... })` aufrufen, werden sofort die globalen Funktionen für die aktuelle Seite sowie alle folgenden Seiten überschrieben, z.B.:

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

await browser.url('https://guinea-pig.webdriver.io/pointer.html')
console.log(await browser.execute(() => (new Date()).toString()))
// returns "Thu Aug 01 2024 17:59:59 GMT-0700 (Pacific Daylight Time)"
```

Sie können die Systemzeit ändern, indem Sie [`setSystemTime`](/docs/api/clock/setSystemTime) oder [`tick`](/docs/api/clock/tick) aufrufen.

Das `FakeTimerInstallOpts`-Objekt kann folgende Eigenschaften haben:

```ts
interface FakeTimerInstallOpts {
   // Installiert gefälschte Timer mit der angegebenen Unix-Epoche
   // @default: 0
   now?: number | Date | undefined;

   // Ein Array mit Namen globaler Methoden und APIs, die gefälscht werden sollen. Standardmäßig
   // ersetzt WebdriverIO nicht `nextTick()` und `queueMicrotask()`. Zum Beispiel,
   // `browser.emulate('clock', { toFake: ['setTimeout', 'nextTick'] })` wird nur
   // `setTimeout()` und `nextTick()` fälschen
   toFake?: FakeMethod[] | undefined;

   // Die maximale Anzahl von Timern, die ausgeführt werden, wenn runAll() aufgerufen wird (Standard: 1000)
   loopLimit?: number | undefined;

   // Weist WebdriverIO an, die simulierte Zeit automatisch basierend auf der Änderung
   // der realen Systemzeit zu erhöhen (z.B. wird die simulierte Zeit um 20ms für jede
   // 20ms Änderung in der realen Systemzeit erhöht)
   // @default false
   shouldAdvanceTime?: boolean | undefined;

   // Nur relevant bei Verwendung mit shouldAdvanceTime: true. Erhöht die simulierte Zeit um
   // advanceTimeDelta ms für jede advanceTimeDelta ms Änderung in der realen Systemzeit
   // @default: 20
   advanceTimeDelta?: number | undefined;

   // Weist FakeTimers an, 'native' (d.h. nicht gefälschte) Timer zu löschen, indem an ihre
   // jeweiligen Handler delegiert wird. Diese werden standardmäßig nicht gelöscht, was zu
   // potenziell unerwartetem Verhalten führen kann, wenn Timer vor der Installation von
   // FakeTimers existierten.
   // @default: false
   shouldClearNativeTimers?: boolean | undefined;
}
```

## Gerät

Der `emulate`-Befehl unterstützt auch die Emulation eines bestimmten mobilen oder Desktop-Geräts durch Änderung des Viewports, des Geräte-Skalierungsfaktors und des User Agents. Dies sollte keinesfalls für Mobile-Tests verwendet werden, da sich Desktop-Browser-Engines von mobilen unterscheiden. Dies sollte nur verwendet werden, wenn Ihre Anwendung ein spezifisches Verhalten für kleinere Viewport-Größen bietet.

Um beispielsweise den User Agent und den Viewport auf ein iPhone 15 umzustellen, führen Sie einfach aus:

```ts
const restore = await browser.emulate('device', 'iPhone 15')
// test your application ...

// reset to original viewport and user agent
await restore()
```

WebdriverIO unterhält eine feste Liste von [allen definierten Geräten](https://github.com/webdriverio/webdriverio/blob/main/packages/webdriverio/src/deviceDescriptorsSource.ts).
