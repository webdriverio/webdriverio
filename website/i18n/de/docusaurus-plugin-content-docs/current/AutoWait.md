---
id: autowait
title: Automatisches Warten
---

Einer der häufigsten Gründe für fehlerhafte Tests sind Interaktionen mit Elementen, die in Ihrer Anwendung zu dem Zeitpunkt, zu dem Sie damit interagieren möchten, nicht vorhanden sind. Moderne Webanwendungen sind sehr dynamisch, Elemente tauchen auf und verschwinden. Als Mensch warten wir unbewusst auf Elemente, aber in einem automatisierten Skript betrachten wir dies nicht als Aktion. Es gibt zwei Möglichkeiten, auf das Erscheinen eines Elements zu warten.

## Implizit vs. Explizit

Das WebDriver-Protokoll bietet [implizite Timeouts](https://w3c.github.io/webdriver/#timeouts) , mit denen angegeben werden kann, wie lange der Treiber warten soll, bis ein Element angezeigt wird. Standardmäßig ist dieses Timeout auf `0` gesetzt und lässt daher den Treiber sofort mit einem `no such element` Fehler zurückkommen, wenn ein Element nicht auf der Seite gefunden werden konnte. Eine Erhöhung dieses Timeouts mit [`setTimeout`](/docs/api/browser/setTimeout) würde den Treiber warten lassen und die Wahrscheinlichkeit erhöhen, dass das Element irgendwann auftaucht.

:::note

Lesen Sie mehr über WebDriver und Framework-bezogene Zeitüberschreitungen im Leitfaden zu [Zeitüberschreitungen](/docs/timeouts)

:::

Ein anderer Ansatz besteht darin, explizites Warten zu verwenden, das in das WebdriverIO-Framework in Befehlen wie [`waitForExist`](/docs/api/element/waitForExist)integriert ist. Mit dieser Technik fragt das Framework nach dem Element, indem es mehrere [`findElements`](/docs/api/webdriver#findelements) Befehle aufruft, bis das Timeout erreicht ist.

## Eingebautes Warten

Beide Wartemechanismen sind nicht miteinander kompatibel und können längere Wartezeiten verursachen. Da implizites Warten eine globale Einstellung ist, wird es auf alle Elemente angewendet, was manchmal nicht das gewünschte Verhalten ist. Daher bietet WebdriverIO einen integrierten Wartemechanismus, der automatisch explizit auf das Element wartet, bevor er damit interagiert.

:::info Recommendation

Wir empfehlen __nicht__ implizites Warten auf Elemente zu verwenden und dies WebdriverIO zu überlassen.

:::

Die Verwendung impliziter Wartezeiten ist auch problematisch, wenn Sie warten möchten, bis ein Element verschwindet. WebdriverIO verwendet Abfragen für das Element, bis es einen Fehler erhält. Das Setzen einer impliziten Warteoption verzögert unnötigerweise die Ausführung des Befehls und kann zu langen Testdauern führen.

Sie können einen Standardwert für das automatische explizite Warten von WebdriverIOs festlegen, indem Sie in Ihrer Konfiguration die Option [`waitforTimeout`](/docs/configuration#waitfortimeout) festlegen.

## Einschränkungen

WebdriverIO kann nur auf Elemente warten, wenn sie implizit definiert sind. Dies ist immer dann der Fall, wenn mit [`$`](/docs/api/browser/$) ein Element abgerufen wird. Es wird jedoch nicht unterstützt, wenn eine Reihe von Elementen wie folgt abgerufen wird:

```js
const divs = await $$('div')
await divs[2].click() // can throw "Cannot read property 'click' of undefined"
```

Es ist absolut legitim, eine Menge von Elementen abzurufen und auf das n-te Element dieser Menge zu klicken. WebdriverIO weiß jedoch nicht, wie viele Elemente Sie erwarten. Da [`$$`](/docs/api/browser/$$) ein [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) von WebdriverIO-Elementen zurückgibt, müssen Sie manuell überprüfen, ob der Rückgabewert genügend Elemente enthält. Wir empfehlen hierfür [`waitUntil`](/docs/api/browser/waitUntil) zu verwenden, z. B.:

```js
const div = await browser.waitUntil(async () => {
    const elems = await $$('div')
    if (elems.length !== 2) {
        return false
    }

    return elems[2]
}, {
    timeoutMsg: 'Never found enough div elements'
})
await div.click()
```
