---
id: element
title: Element
---

An Element Object is an object representing an element on the remote user agent, e.g. a [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) when running a session within a browser or [a mobile element](https://developer.apple.com/documentation/swift/sequence/element) for mobile. Elementy możemy pozyskiwać z pomocą jednego z wielu poleceń służących do wyszukiwania elementów, np. [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) albo [`shadow$`](/docs/api/element/shadow$).

## Właściwości

Obiekt element ma następujące właściwości:

| Nazwa       | Typ      | Szczegóły                                                                                                                                                                                                                                                          |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sessionId` | `String` | Identyfikator sesji (session id) przypisany ze zdalnego serwera.                                                                                                                                                                                                   |
| `elementId` | `String` | Powiązana [referencja do elementu sieciowego](https://w3c.github.io/webdriver/#elements), którego można użyć do interakcji z elementem na poziomie protokołu                                                                                                       |
| `selector`  | `String` | [Selektor](/docs/selectors) wykorzystywany do wyszukania elementu.                                                                                                                                                                                                 |
| `parent`    | `Object` | [Obiekt przeglądarki](/docs/api/browser), w przypadku, gdy element został pobrany z jej wykorzystaniem (np. `const elem = browser.$('selector')`) lub [obiekt typu element](/docs/api/element), jeśli został pobrany z zakresu elementu (np. `elem.$('selector')`) |
| `options`   | `Object` | [Opcje](/docs/configuration) (options) WebdriverIO w zależności od sposobu utworzenia obiektu przeglądarki. Zobacz więcej w sekcji [typy konfiguracji](/docs/setuptypes).                                                                                          |

## Metody
An element object provides all methods from the protocol section, e.g. [WebDriver](/docs/api/webdriver) protocol as well as commands listed within the element section. Dostępność poleceń protokołu zależy od rodzaju sesji. Jeśli uruchomisz zautomatyzowaną sesję przeglądarki, żadne z [poleceń Appium](/docs/api/appium) nie będzie dostępne i vice versa.

Dodatkowo dostępne są następujące polecenia:

| Nazwa              | Parametry                                                             | Szczegóły                                                                                                                                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Umożliwia zdefiniowanie niestandardowych poleceń, które mogą być wywoływane z obiektu przeglądarki do celów kompozycji. Przeczytaj więcej w przewodniku [Niestandardowe polecenie](/docs/customcommands) (custom command).                                                                                               |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Pozwala zastąpić dowolne polecenie przeglądarki niestandardową funkcjonalnością. Zachowaj ostrożność przy korzystaniu z tej metody, ponieważ może zdezorientować użytkowników frameworka. Przeczytaj więcej w przewodniku [Niestandardowe polecenie](/docs/customcommands#overwriting-native-commands) (custom command). |

## Uwagi

### Łańcuch elementów

When working with elements WebdriverIO provides special syntax to simplify querying them and composite complex nested element lookups. Ponieważ obiekty typu element umożliwiają znajdowanie elementów w ramach ich gałęzi drzewa przy użyciu typowych metod wyszukiwania, użytkownicy mogą pobierać zagnieżdżone elementy w następujący sposób:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

W przypadku tworzenia głęboko zagnieżdżonych struktur elementów ucierpieć może na tym ogólna czytelność. Therefore WebdriverIO has the concept of chained element queries that allow fetching nested elements like this:

```js
console.log(await $('#header').$('#headline').getText())
```

Działa to również w przypadku pobierania zestawu elementów, np.:

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

When working with a set of elements this can be especially useful when trying to interact with them, so instead of doing:

```js
const elems = await $$('div')
const locations = await Promise.all(
    elems.map((el) => el.getLocation())
)
```

Możesz bezpośrednio wywoływać metody należące do tablic w łańcuchu elementów, np.:

```js
const location = await $$('div').map((el) => el.getLocation())
```

same as:

```js
const divs = await $$('div')
const location = await divs.map((el) => el.getLocation())
```

WebdriverIO uses a custom implementation that supports asynchronous iterators under the hood so all commands from their API are also supported for these use cases.

__Note:__ all async iterators return a promise even if your callback doesn't return one, e.g.:

```ts
const divs = await $$('div')
console.log(divs.map((div) => div.selector)) // ❌ returns "Promise<string>[]"
console.log(await divs.map((div) => div.selector)) // ✅ returns "string[]"
```

### Niestandardowe polecenia

Możesz ustawić niestandardowe polecenia w zakresie przeglądarki, aby wyodrębnić często wykorzystywane przypadki użycia. Aby uzyskać więcej informacji, zapoznaj się z naszym przewodnikiem na temat [poleceń niestandardowych](/docs/customcommands#adding-custom-commands).
