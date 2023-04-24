---
id: selectors
title: Selektoren
---

Das [WebDriver Protocol](https://w3c.github.io/webdriver/) bietet mehrere Auswahlstrategien zum Abfragen eines Elements an. WebdriverIO vereinfacht sie, um die Auswahl von Elementen einfach zu halten. Bitte beachten Sie, dass die Befehle zum Abfragen von Elementen zwar `$` und `$$` heißen, aber nichts mit jQuery oder der [Sizzle Selector Engine](https://github.com/jquery/sizzle) zu tun haben.

Obwohl so viele verschiedene Selektoren verfügbar sind, bieten nur wenige von ihnen eine verlässliche Möglichkeit, das richtige Element zu finden. Zum Beispiel mit der folgenden Schaltfläche:

```html
<button
  id="main"
  class="btn btn-large"
  name="submission"
  role="button"
  data-testid="submit"
>
  Submit
</button>
```

Empfehlen wir (oder nicht) die folgenden Selektoren:

| Selektor                                      | Empfehlung | Anmerkungen                                                                |
| --------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `$('button')`                                 | 🚨 Niemals  | Am schlimmsten - zu allgemein, kein Kontext.                               |
| `$('.btn.btn-large')`                         | 🚨 Niemals  | Weniger Gut. Verbunden mit Styling. Fehler durch Style-Änderungen möglich. |
| `$('#main')`                                  | ⚠️ Sparsam | Besser. Aber immer noch an Styling oder JS-Event-Listener gekoppelt.       |
| `$(() => document.queryElement('button'))` | ⚠️ Sparsam | Ermöglicht effektive Abfragen, allerdings komplex zu schreiben.            |
| `$('button[name="submission"]')`              | ⚠️ Sparsam | Gekoppelt an das Attribut `name`, das HTML-Semantik hat.                   |
| `$('button[data-testid="submit"]')`           | ✅ Gut      | Erfordert zusätzliches Attribut, das keine weitere Funktion hat.           |
| `$('aria/Submit')` or `$('button=Submit')`    | ✅ Immer    | Am besten geeignet. Ähnelt, wie der Benutzer mit der Seite interagiert.    |

## CSS-Selektoren

Wenn nicht anders angegeben, fragt WebdriverIO Elemente mit dem [CSS Selektor](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) ab, z. B.:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L7-L8
```

## Link-Text

Um ein Link-Element mit einem bestimmtem Text zu bekommen, fragen Sie den Text beginnend mit einem Gleichheitszeichen (`=`) ab.

Zum Beispiel:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L3
```

Sie können dieses Element abfragen, indem Sie Folgendes aufrufen:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L16-L18
```

## Teillinktext

Um ein Link-Element zu finden, dessen sichtbarer Text teilweise mit Ihrem Suchwert übereinstimmt, fragen Sie es ab, indem Sie `*=` vor die Abfragezeichenfolge setzen (z. B. `*=driver`).

Sie können das Element aus dem obigen Beispiel abfragen, indem Sie auch Folgendes aufrufen:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L24-L26
```

__Hinweis:__ Sie können nicht mehrere Selektorstrategien in einem Selektor mischen. Verwenden Sie mehrere verkettete Elementabfragen, um dasselbe Ziel zu erreichen, z. B.:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('*=driver')
```

## Element mit bestimmtem Text

Die gleiche Technik kann auch auf Elemente angewendet werden.

Hier ist zum Beispiel eine Abfrage für eine Überschrift der Ebene 1 mit dem Text „Welcome to my page“:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L2
```

Sie können dieses Element abfragen, indem Sie Folgendes aufrufen:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L35-L36
```

Oder verwenden Sie die Teiltext-Abfrage:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L42-L43
```

Das gleiche funktioniert für `id` und `class` Namen:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L4
```

Sie können dieses Element abfragen, indem Sie Folgendes aufrufen:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L45-L55
```

__Hinweis:__ Sie können nicht mehrere Selektorstrategien in einem Selektor mischen. Verwenden Sie mehrere verkettete Elementabfragen, um dasselbe Ziel zu erreichen, z. B.:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('h1*=Welcome')
```

## Tag-Name

Um ein Element mit einem bestimmten Tag-Namen abzufragen, verwenden Sie `<tag>` oder `<tag />`.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L5
```

Sie können dieses Element abfragen, indem Sie Folgendes aufrufen:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L61-L62
```

## Namensattribut

Zum Abfragen von Elementen mit einem bestimmten Namensattribut können Sie entweder einen normalen CSS3-Selektor verwenden oder die bereitgestellte Namensstrategie aus dem [JSONWireProtocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) verwenden, indem Sie etwas wie [name="some-name"] als Selektorparameter übergeben:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L68-L69
```

__Hinweis:__ Diese Auswahlstrategie ist veraltet und funktioniert nur in alten Browsern, die vom JSONWireProtocol-Protokoll oder von Appium ausgeführt werden.

## xPath

Es ist auch möglich, Elemente über einen bestimmten [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath)abzufragen.

Ein xPath-Selektor hat ein Format wie `//body/div[6]/div[1]/span[1]`.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/xpath.html
```

Sie können den zweiten `

` Tag abfragen, indem Sie Folgendes aufrufen:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L75-L76
```

Sie können xPath auch verwenden, um den DOM-Baum nach oben und unten zu durchlaufen:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L78-L79
```

## Accessibility Name Selektor

Fragen Sie Elemente nach ihrem Accessibility Namen ab. Der Accessibility Name wird von einem Screenreader angesagt, wenn dieses Element den Fokus erhält. Der Accessibility Name kann sowohl visueller Inhalt als auch versteckte Textalternativen darstellen.

:::info

Weitere Informationen zu diesem Selektor finden Sie in unserem [Release-Blogbeitrag](/blog/2022/09/05/accessibility-selector)

:::

### Finden von Elementen via `Aria-Label`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L1
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L86-L87
```

### Finden von Elementen via `aria-labelledby`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L2-L3
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L93-L94
```

### Finden von Elementen via dessen Inhalt

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L4
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L100-L101
```

### Finden von Elementen durch ein "titel" Attribut

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L5
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L107-L108
```

### Finden von Elementen durch ein `alt` Attribut

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L114-L115
```

## ARIA - Rollen-Attribut

Um Elemente basierend auf [ARIA-Rollen](https://www.w3.org/TR/html-aria/#docconformance) zu finden, können Sie die Rolle des Elements direkt angeben, z. B. `[role=button]` als Selektor:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L13
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L131-L132
```

## ID Attribut

Die Locator-Strategie „id“ wird im WebDriver-Protokoll nicht unterstützt, man sollte stattdessen entweder CSS- oder xPath-Selector-Strategien verwenden, um Elemente mit ID zu finden.

Einige Treiber (z. B. [Appium You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies)) unterstützen [diesen Selektor](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies) jedoch möglicherweise immer noch.

Aktuell unterstützte Selektor-Syntax für ID sind:

```js
//css locator
const button = await $('#someid')
//xpath locator
const button = await $('//*[@id="someid"]')
//id strategy
// Note: works only in Appium or similar frameworks which supports locator strategy "ID"
const button = await $('id=resource-id/iosname')
```

## Elemente finden via JavaScript-Funktion

Sie können auch JavaScript-Funktionen verwenden, um Elemente mithilfe web-nativer APIs zu abzufragen. Natürlich können Sie dies nur innerhalb eines Webkontexts tun (z. B. `browser`oder im Web-Kontext auf Mobilgeräten).

Bei folgender HTML-Struktur:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/js.html
```

können Sie das Geschwisterelement von `#elem` wie folgt abfragen:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L139-L143
```

## Tiefe Selektoren

Viele Frontend-Anwendungen verlassen sich stark auf Elemente mit [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM). Es ist technisch nicht möglich, Elemente innerhalb des Shadow-DOM ohne Workarounds abzufragen. Die [`shadow$`](https://webdriver.io/docs/api/element/shadow$) und [`shadow$$`](https://webdriver.io/docs/api/element/shadow$$) waren Möglichkeiten, die ihre [Einschränkungen hatten](https://github.com/Georgegriff/query-selector-shadow-dom#how-is-this-different-to-shadow). Mit dem Tiefenselektor können Sie jetzt alle Elemente in jedem Schatten-DOM mit dem allgemeinen Abfragebefehl abfragen.

Angenommen, wir haben eine Anwendung mit der folgenden Struktur:

![Chrome-Beispiel](https://github.com/Georgegriff/query-selector-shadow-dom/raw/main/Chrome-example.png "Chrome-Beispiel")

Mit diesem Selektor können Sie das `<button />` Element abfragen, das in einem anderen Schatten-DOM verschachtelt ist, z.B.:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L147-L149
```

## Mobile Selektoren

Für hybride mobile Tests ist es wichtig, dass sich der Automatisierungsserver im richtigen *context* befindet, bevor Befehle ausgeführt werden. Für die Automatisierung von Gesten sollte der Treiber idealerweise auf nativen Kontext eingestellt werden. Um jedoch Elemente aus dem DOM auszuwählen, muss der Treiber auf den Webview-Kontext der Plattform eingestellt werden. Erst *dann* können die oben genannten Methoden verwendet werden.

Beim nativen mobilen Testen gibt es keinen Wechsel zwischen Kontexten, da Sie mobile Strategien verwenden und die zugrunde liegende Geräteautomatisierungstechnologie direkt verwenden müssen. Dies ist besonders nützlich, wenn ein Test eine feinkörnige Kontrolle über das Finden von Elementen erfordert.

### Android UiAutomator

Das UI Automator-Framework von Android bietet eine Reihe von Möglichkeiten zum Suchen von Elementen. Sie können die [UI Automator API](https://developer.android.com/tools/testing-support-library/index.html#uia-apis), insbesondere die [UiSelector-Klasse](https://developer.android.com/reference/androidx/test/uiautomator/UiSelector) verwenden, um Elemente zu lokalisieren. In Appium können Sie den Java-Code als Zeichenfolge an den Server senden, der in der Umgebung der Anwendung ausgeführt wird und das Element oder die Elemente zurückgibt.

```js
const selector = 'new UiSelector().text("Cancel").className("android.widget.Button")'
const button = await $(`android=${selector}`)
await button.click()
```

### Android DataMatcher und ViewMatcher (nur Espresso)

Die DataMatcher-Strategie von Android bietet eine Möglichkeit, Elemente mit [DataMatcher](https://developer.android.com/reference/android/support/test/espresso/DataInteraction)zu finden

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"]
})
await menuItem.click()
```

Und ähnlich [View Matcher](https://developer.android.com/reference/android/support/test/espresso/ViewInteraction)

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"],
  "class": "androidx.test.espresso.matcher.ViewMatchers"
})
await menuItem.click()
```

### Android View Tag (nur Espresso)

Die View-Tag-Strategie bietet eine bequeme Möglichkeit, Elemente anhand ihres [-Tags](https://developer.android.com/reference/android/support/test/espresso/matcher/ViewMatchers.html#withTagValue%28org.hamcrest.Matcher%3Cjava.lang.Object%3E%29)zu finden.

```js
const elem = await $('-android viewtag:tag_identifier')
await elem.click()
```

### iOS UIAutomation

Bei der Automatisierung einer iOS-Anwendung kann Apples [UI Automation Framework](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) verwendet werden, um Elemente zu finden.

Diese JavaScript [API](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/index.html#//apple_ref/doc/uid/TP40009771) verfügt über Methoden für den Zugriff auf die View und alles darin enthaltene.

```js
const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
const button = await $(`ios=${selector}`)
await button.click()
```

Sie können auch das "Predicate Searching" innerhalb der iOS-UI-Automatisierung in Appium verwenden, um die Elementauswahl noch weiter zu verfeinern. Siehe [iOS Predicate](https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/ios/ios-predicate.md) für weitere Details.

### iOS XCUITest Prädikatzeichenfolgen und Klassenketten

Mit iOS 10 und höher (unter Verwendung des `XCUITest` Treibers) können Sie [Prädikatzeichenfolgen verwenden](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules):

```js
const selector = `type == 'XCUIElementTypeSwitch' && name CONTAINS 'Allow'`
const switch = await $(`-ios predicate string:${selector}`)
await switch.click()
```

Und [Klassenketten](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules):

```js
const selector = '**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton'
const button = await $(`-ios class chain:${selector}`)
await button.click()
```

### Accessibility ID

Die Locator-Strategie `Accessibility ID` wurde entwickelt, um eine eindeutige Kennung für ein UI-Element zu bekommen. Dies hat den Vorteil, dass sich durch Übersetzungen oder andere Umstände, die den Text ändern könnte, der Selektor stabil bleibt. Außerdem kann es hilfreich sein, plattformübergreifende Tests zu erstellen, wenn funktional gleiche Elemente dieselbe Accessibility-ID haben.

- Für iOS ist es der `accessibility identifier` und ist von Apple [hier](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIAccessibilityIdentification_Protocol/index.html) festgelegt.
- Für Android wird die `Accessibility-ID` der `content-description` für das Element zugeordnet, wie [hier beschrieben](https://developer.android.com/training/accessibility/accessible-app.html).

Für beide Plattformen ist es normalerweise die beste Methode, ein Element (oder mehrere Elemente) anhand ihrer `Accessibility-ID` zu erhalten. Es ist auch der bevorzugte Weg gegenüber der veralteten `Name-` Strategie.

```js
const elem = await $('~my_accessibility_identifier')
await elem.click()
```

### Klassenname

Die `Klassenname-` Strategie ist eine `Zeichenfolge`, die ein UI-Element in der aktuellen Ansicht darstellt.

- Für iOS ist es der vollständige Name einer [UIAutomation-Klasse](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html)und beginnt mit `UIA-`, z. B. `UIATextField` für ein Textfeld. Eine vollständige Referenz finden Sie [hier](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation).
- Für Android ist es der vollständig qualifizierte Name eines [UI Automator](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) [class](https://developer.android.com/reference/android/widget/package-summary.html), z. B. `android.widget.EditText` für ein Textfeld. Eine vollständige Referenz finden Sie [hier](https://developer.android.com/reference/android/widget/package-summary.html).
- Für Youi.tv ist es der vollständige Name einer Youi.tv-Klasse und wird mit `CYI-`sein, z. B. `CYIPushButtonView` für ein Button Element. Eine vollständige Referenz finden Sie auf GitHub Seite auf den Dokumentationsseiten des [You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver)

```js
// iOS example
await $('UIATextField').click()
// Android example
await $('android.widget.DatePicker').click()
// Youi.tv example
await $('CYIPushButtonView').click()
```

## Ketten-Selektoren

Wenn Sie in Ihrer Abfrage spezifischer sein möchten, können Sie Selektoren verketten, bis Sie das richtige Element gefunden haben. Befehle der Element API nutzen immer den Kontext des vorhergegangen Query Befehls.

Wenn Sie beispielsweise eine DOM-Struktur haben, die wie folgt aussieht:

```html
<div class="row">
  <div class="entry">
    <label>Product A</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
  <div class="entry">
    <label>Product B</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
  <div class="entry">
    <label>Product C</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
</div>
```

Und Sie möchten Produkt B in den Warenkorb legen, so wäre es schwierig, dies nur mit dem CSS-Selektor zu tun.

Mit der Selektorverkettung ist es viel einfacher. Einfach Schritt für Schritt das gewünschte Element eingrenzen:

```js
await $('.row .entry:nth-child(2)').$('button*=Add').click()
```

### Appium Bild Selektoren

Mit der  `-image-` Selektor ist es möglich, Appium eine Bilddatei zu senden, die ein Element darstellt, auf das Sie zugreifen möchten.

Unterstützte Dateiformate `jpg,png,gif,bmp,svg`

Eine vollständige Referenz finden Sie [hier](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md)

```js
const elem = await $('./file/path/of/image/test.jpg')
await elem.click()
```

**Hinweis**: Die Art und Weise, wie Appium mit diesem Selektor arbeitet, ist, dass es intern einen (App-)Screenshot erstellt und den bereitgestellten Bildselektor verwendet, um zu überprüfen, ob das Element in diesem (App-)Screenshot gefunden werden kann.

Beachten Sie, dass Appium die Größe des aufgenommenen (App-) möglicherweise an die CSS-Größe Ihres (App-)Bildschirms anpasst (dies geschieht auf iPhones, aber auch auf Mac-Computern mit einem Retina-Display, da der DPR größer ist als 1). Dies führt dazu dass keine Übereinstimmung gefunden wird, da die bereitgestellte Bildauswahl möglicherweise aus dem ursprünglichen Screenshot stammt. Sie können dies beheben, indem Sie die Appium Server-Einstellungen aktualisieren, siehe die [Appium-Dokumentation](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md#related-settings) für die Einstellungen und [diesen Kommentar](https://github.com/webdriverio/webdriverio/issues/6097#issuecomment-726675579) für eine detaillierte Erklärung.

## React Selektoren

WebdriverIO bietet eine Möglichkeit, React-Komponenten basierend auf dem Komponentennamen auszuwählen. Dazu stehen Ihnen zwei Befehle zur Auswahl: `react$` und `react$$`.

Mit diesen Befehlen können Sie Komponenten aus dem [React VirtualDOM](https://reactjs.org/docs/faq-internals.html) auswählen und entweder ein einzelnes WebdriverIO-Element oder ein Array von Elementen zurückgeben (je nachdem, welche Funktion verwendet wird).

**Hinweis**: Die Befehle `react$` und `react$$` sind in ihrer Funktionalität ähnlich, außer dass `react$$` *alle* übereinstimmenden Instanzen als ein Array von WebdriverIO-Elementen zurückgibt und `react$` nur die erste gefundene Instanz.

#### Einfaches Beispiel

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent() {
    return (
        <div>
            MyComponent
        </div>
    )
}

function App() {
    return (<MyComponent />)
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

Im obigen Code gibt es eine einfache `MyComponent` -Instanz innerhalb der Anwendung, die React innerhalb eines HTML-Elements mit `id="root"`rendert.

Mit dem Befehl `browser.react$` können Sie eine Instanz von `MyComponent`auswählen:

```js
const myCmp = await browser.react$('MyComponent')
```

Nachdem Sie nun das WebdriverIO-Element in der Variablen `myCmp` gespeichert haben, können Sie Elementbefehle dafür ausführen.

#### Komponenten filtern

Die Bibliothek, die WebdriverIO intern verwendet, ermöglicht es, Ihre Auswahl nach Props und/oder Zustand der Komponente zu filtern. Dazu müssen Sie dem Browser-Befehl ein zweites Argument für Props und/oder ein drittes Argument für State übergeben.

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent(props) {
    return (
        <div>
            Hello { props.name || 'World' }!
        </div>
    )
}

function App() {
    return (
        <div>
            <MyComponent name="WebdriverIO" />
            <MyComponent />
        </div>
    )
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

Wenn Sie die Instanz von `MyComponent` mit einem Prop `name` als `WebdriverIO`auswählen möchten, können Sie den Befehl wie folgt ausführen:

```js
const myCmp = await browser.react$('MyComponent', {
    props: { name: 'WebdriverIO' }
})
```

Wenn Sie unsere Auswahl nach Status filtern möchten, sieht der Befehl `browser` ungefähr so aus:

```js
const myCmp = await browser.react$('MyComponent', {
    state: { myState: 'some value' }
})
```

#### Umgang mit `React.Fragment`

Wenn Sie den Befehl `react$` verwenden, um React [fragments](https://reactjs.org/docs/fragments.html) auszuwählen, gibt WebdriverIO das erste untergeordnete Element dieser Komponente als Knoten der Komponente zurück. Wenn Sie `react$$`verwenden, erhalten Sie ein Array mit allen HTML-Knoten innerhalb der Fragmente, die mit dem Selektor übereinstimmen.

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent() {
    return (
        <React.Fragment>
            <div>
                MyComponent
            </div>
            <div>
                MyComponent
            </div>
        </React.Fragment>
    )
}

function App() {
    return (<MyComponent />)
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

In Anbetracht des obigen Beispiels würden die Befehle so funktionieren:

```js
await browser.react$('MyComponent') // returns the WebdriverIO Element for the first <div />
await browser.react$$('MyComponent') // returns the WebdriverIO Elements for the array [<div />, <div />]
```

**Hinweis:** Wenn Sie mehrere Instanzen von `MyComponent` haben und `react$$` verwenden, um diese Fragmentkomponenten auszuwählen, erhalten Sie ein eindimensionales Array aller Knoten zurück. Mit anderen Worten, wenn Sie 3 `<MyComponent />` Instanzen haben, erhalten Sie ein Array mit sechs WebdriverIO-Elementen zurück.

## Benutzerdefinierte Selektoren

Wenn Ihre App eine bestimmte Methode zum Abrufen von Elementen erfordert, können Sie sich selbst eine benutzerdefinierte Selektorstrategie definieren, die Sie mit `custom$` und `custom$$`verwenden können. Registrieren Sie dazu Ihre Strategie einmalig zu Beginn des Tests:

```js
browser.addLocatorStrategy('myCustomStrategy', (selector, root) => {
    /**
     * scope should be document if called on browser object
     * and `root` if called on an element object
     */
    const scope = root ? root : document
    return scope.querySelectorAll(selector)
})
```

Bei folgender HTML-Struktur:

```html
<div class="foobar" id="first">
    <div class="foobar" id="second">
        barfoo
    </div>
</div>
```

Verwenden Sie Ihren benutzerdefinierten Selektor wie folgt::

```js
const elem = await browser.custom$('myCustomStrategy', '.foobar')
console.log(await elem.getAttribute('id')) // returns "first"
const nestedElem = await elem.custom$('myCustomStrategy', '.foobar')
console.log(await elem.getAttribute('id')) // returns "second"
```

**Hinweis:** Dies funktioniert nur in einer Webumgebung, in der der Befehl [`execute`](/docs/api/browser/execute) ausgeführt werden kann.
