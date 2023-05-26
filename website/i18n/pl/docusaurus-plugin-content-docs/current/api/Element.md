---
id: element
title: Element
---

Element jest obiektem reprezentującym element zdalnego agenta użytkownika (remote user agent), np. [element DOM](https://developer.mozilla.org/en-US/docs/Web/API/Element) jeżeli korzystamy z przeglądarki lub [element mobilny](https://developer.apple.com/documentation/swift/sequence/element) w przypadku urządzeń mobilnych. Elementy możemy pozyskiwać z pomocą jednego z wielu poleceń służących do wyszukiwania elementów, np. [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) albo [`shadow$`](/docs/api/element/shadow$).

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

Obiekt typu element udostępnia wszystkie metody z sekcji protokołu, np. protokół [WebDriver](/docs/api/webdriver) oraz polecenia wymienione w sekcji elementu. Dostępność poleceń protokołu zależy od rodzaju sesji. Jeśli uruchomisz zautomatyzowaną sesję przeglądarki, żadne z [poleceń Appium](/docs/api/appium) nie będzie dostępne i vice versa.

Dodatkowo dostępne są następujące polecenia:

| Nazwa              | Parametry                                                             | Szczegóły                                                                                                                                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Umożliwia zdefiniowanie niestandardowych poleceń, które mogą być wywoływane z obiektu przeglądarki do celów kompozycji. Przeczytaj więcej w przewodniku [Niestandardowe polecenie](/docs/customcommands) (custom command).                                                                                               |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Pozwala zastąpić dowolne polecenie przeglądarki niestandardową funkcjonalnością. Zachowaj ostrożność przy korzystaniu z tej metody, ponieważ może zdezorientować użytkowników frameworka. Przeczytaj więcej w przewodniku [Niestandardowe polecenie](/docs/customcommands#overwriting-native-commands) (custom command). |

## Uwagi

### Łańcuch elementów

Podczas pracy z elementami WebdriverIO zapewnia specjalną składnię, która upraszcza wykonywanie zapytań i złożone wyszukiwanie zagnieżdżonych elementów. Ponieważ obiekty typu element umożliwiają znajdowanie elementów w ramach ich gałęzi drzewa przy użyciu typowych metod wyszukiwania, użytkownicy mogą pobierać zagnieżdżone elementy w następujący sposób:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

W przypadku tworzenia głęboko zagnieżdżonych struktur elementów ucierpieć może na tym ogólna czytelność. Dlatego WebdriverIO wprowadza łańcuchy zapytań o elementy, które pozwalają pobierać zagnieżdżone elementy w następujący sposób:

```js
console.log(await $('#header').$('#headline').getText())
```

Działa to również w przypadku pobierania zestawu elementów, np.:

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

Pracując z zestawem elementów, może to być szczególnie przydatne przy próbie interakcji z nimi, a więc, zamiast:

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

WebdriverIO wykorzystuje bibliotekę [`p-iteration`](https://www.npmjs.com/package/p-iteration#api), więc wszystkie polecenia API należące do niej są również dostępne dla tych przypadków.

### Niestandardowe polecenia

Możesz ustawić niestandardowe polecenia w zakresie przeglądarki, aby wyodrębnić często wykorzystywane przypadki użycia. Aby uzyskać więcej informacji, zapoznaj się z naszym przewodnikiem na temat [poleceń niestandardowych](/docs/customcommands#adding-custom-commands).
