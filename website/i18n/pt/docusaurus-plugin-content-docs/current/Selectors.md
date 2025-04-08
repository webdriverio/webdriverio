---
id: selectors
title: Seletores
---

O [Protocolo WebDriver](https://w3c.github.io/webdriver/) fornece diversas estratégias de seletor para consultar um elemento. O WebdriverIO os simplifica para manter a seleção de elementos simples. Observe que, embora o comando para consultar elementos seja chamado `$` e `$$`, eles não têm nada a ver com o jQuery ou o [Sizzle Selector Engine](https://github.com/jquery/sizzle).

Embora existam tantos seletores diferentes disponíveis, apenas alguns deles oferecem uma maneira resiliente de encontrar o elemento certo. Por exemplo, dado o botão a seguir: Nós recomendamos e não recomendamos os seguintes seletores:

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

Nós __recomendamos__ e __não recomendamos__ os seguintes seletores:

| Seletor                                       | Recomendado          | Observações                                                                                                                                                                                          |
| --------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$('button')`                                 | 🚫 Nunca              | O pior – muito genérico, sem contexto.                                                                                                                                                               |
| `$('.btn.btn-large')`                         | 🚫 Nunca              | Ruim. Acoplado ao estilo. Altamente sujeito a mudanças.                                                                                                                                              |
| `$('#main')`                                  | ⚠️ Use com moderação | Melhor. Mas ainda acoplado a ouvintes de eventos de estilo ou JS.                                                                                                                                    |
| `$(() => document.queryElement('button'))` | ⚠️ Moderado          | Consulta eficaz, complexa de escrever.                                                                                                                                                               |
| `$('button[name="submission"]')`              | ⚠️ Moderado          | Acoplado ao atributo `name` que possui semântica HTML.                                                                                                                                               |
| `$('button[data-testid="submit"]')`           | ✅ Bom                | Requer atributo adicional, não conectado ao a11y.                                                                                                                                                    |
| `$('aria/Submit')` or `$('button=Submit')`    | ✅ Sempre             | Melhor. Semelhante à forma como o usuário interage com a página. É recomendável usar os arquivos de tradução do seu frontend para que seus testes nunca falhem quando as traduções forem atualizadas |

## Seletor de consulta CSS

Se não for indicado o contrário, o WebdriverIO consultará elementos usando o padrão [seletor CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors), por exemplo:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L7-L8
```

## Texto do link

Para obter um elemento âncora com um texto específico, consulte o texto começando com um sinal de igual (`=`).

Por exemplo:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L3
```

Você pode consultar esse elemento chamando:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L16-L18
```

## Texto do link parcial

Para encontrar um elemento âncora cujo texto visível corresponde parcialmente ao seu valor de pesquisa, consulte-o usando `*=` na frente da string de consulta (por exemplo, `*=driver`).

Você pode consultar o elemento do exemplo acima chamando também:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L24-L26
```

__Observação:__ você não pode misturar várias estratégias de seletor em um seletor. Use várias consultas de elementos encadeados para atingir o mesmo objetivo, por exemplo:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('*=driver')
```

## Elemento com determinado texto

A mesma técnica pode ser aplicada aos elementos. Além disso, também é possível fazer uma correspondência sem distinção entre maiúsculas e minúsculas usando `.=` ou `.*=` na consulta.

Por exemplo, aqui está uma consulta para um título de nível 1 com o texto "Bem-vindo à minha página":

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L2
```

Você pode consultar o elemento esse chamar:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/13eddfac6f18a2a4812cc09ed7aa5e468f392060/selectors/example.js#L35C1-L38
```

Ou usando texto parcial da consulta:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/13eddfac6f18a2a4812cc09ed7aa5e468f392060/selectors/example.js#L44C9-L47
```

O mesmo funciona para nomes `id` e `class`:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L4
```

Você pode consultar esse elemento chamando:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/13eddfac6f18a2a4812cc09ed7aa5e468f392060/selectors/example.js#L49-L67
```

__Observação:__ você não pode misturar várias estratégias de seletor em um seletor. Use várias consultas de elementos encadeados para atingir o mesmo objetivo, por exemplo:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('h1*=Welcome')
```

## Nome da Tag

Para consultar um elemento com um nome de tag específico, use `<tag>` ou `<tag />`.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L5
```

Você pode consultar esse elemento chamando:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L61-L62
```

## Atributo de nome

Para consultar elementos com um atributo de nome específico, você pode usar um seletor CSS3 normal ou a estratégia de nome fornecida pelo [JSONWireProtocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) passando algo como [name="some-name"] como parâmetro do seletor:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L68-L69
```

__Observação:__ esta estratégia de seletor foi descontinuada e só funciona em navegadores antigos executados pelo protocolo JSONWireProtocol ou usando o Appium.

## xPath

Também é possível consultar elementos por meio de um [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath) específico.

Um seletor xPath tem um formato como `//body/div[6]/div[1]/span[1]`.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/xpath.html
```

Você pode consultar o segundo parágrafo chamando:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L75-L76
```

Você também pode usar o xPath para percorrer a árvore DOM para cima e para baixo:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L78-L79
```

## Seletor de nomes de acessibilidade

Consultar elementos pelo seu nome acessível. O nome acessível é o que é anunciado por um leitor de tela quando aquele elemento recebe foco. O valor do nome acessível pode ser tanto conteúdo visual quanto alternativas de texto oculto.

:::info

Você pode ler mais sobre esse seletor em nossa [postagem de lançamento do blog](/blog/2022/09/05/accessibility-selector)

:::

### Buscar por `aria-label`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L1
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L86-L87
```

### Buscar por `aria-labelledby`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L2-L3
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L93-L94
```

### Buscar por conteúdo

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L4
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L100-L101
```

### Buscar por título

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L5
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L107-L108
```

### Buscar pela propriedade `alt`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L114-L115
```

## ARIA - Atributo de Função

Para consultar elementos com base em [funções ARIA](https://www.w3.org/TR/html-aria/#docconformance), você pode especificar diretamente a função do elemento como `[role=button]` como parâmetro do seletor:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L13
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L131-L132
```

## Atributo de ID

A estratégia de localização "id" não é suportada no protocolo WebDriver. Em vez disso, deve-se usar estratégias de seletor CSS ou xPath para encontrar elementos usando ID.

No entanto, alguns drivers (por exemplo, [Appium You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies)) ainda podem [suportar](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies) esse seletor.

As sintaxes de seletor suportadas atualmente para ID são:

```js
//css locator
const button = await $('#someid')
//xpath locator
const button = await $('//*[@id="someid"]')
//id strategy
// Note: works only in Appium or similar frameworks which supports locator strategy "ID"
const button = await $('id=resource-id/iosname')
```

## Função JS

Você também pode usar funções JavaScript para buscar elementos usando APIs nativas da web. Claro, você só pode fazer isso dentro de um contexto da web (por exemplo, `navegador` ou contexto da web em dispositivos móveis).

Dada a seguinte estrutura HTML:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/js.html
```

Você pode consultar o elemento irmão de `#elem` da seguinte maneira:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L139-L143
```

## Seletores profundos

:::warning

A partir da `v9` do WebdriverIO, não há necessidade desse seletor especial, pois o WebdriverIO atravessa automaticamente o Shadow DOM para você. É recomendável migrar deste seletor removendo o `>>>` na frente dele.

:::

Muitos aplicativos frontend dependem fortemente de elementos com [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM). É tecnicamente impossível consultar elementos dentro do shadow DOM sem soluções alternativas. [`shadow$`](https://webdriver.io/docs/api/element/shadow$) e [`shadow$$`](https://webdriver.io/docs/api/element/shadow$$) foram soluções alternativas que tiveram suas [limitações](https://github.com/Georgegriff/query-selector-shadow-dom#how-is-this-different-to-shadow). Com o seletor de profundidade você pode consultar todos os elementos dentro de qualquer DOM sombra usando o comando de consulta comum.

Dado que temos uma aplicação com a seguinte estrutura:

![Exemplo do Chrome](https://github.com/Georgegriff/query-selector-shadow-dom/raw/main/Chrome-example.png "Exemplo do Chrome")

Com este seletor você pode consultar o elemento `<button />` que está aninhado dentro de outro DOM sombra, por exemplo:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L147-L149
```

## Seletores Mobiles

Para testes móveis híbridos, é importante que o servidor de automação esteja no *contexto* correto antes de executar comandos. Para automatizar gestos, o driver idealmente deve ser definido para contexto nativo. Mas para selecionar elementos do DOM, o driver precisará ser definido para o contexto de webview da plataforma. Somente *então* os métodos mencionados acima poderão ser utilizados.

Para testes móveis nativos, não há alternância entre contextos, pois você precisa usar estratégias móveis e usar a tecnologia de automação de dispositivo subjacente diretamente. This is especially useful when a test needs some fine-grained control over finding elements.

### Android UiAutomator

A estrutura do UI Automator do Android fornece várias maneiras de encontrar elementos. Você pode usar a [API do UI Automator](https://developer.android.com/tools/testing-support-library/index.html#uia-apis), em particular a [classe UiSelector](https://developer.android.com/reference/androidx/test/uiautomator/UiSelector) para localizar elementos. No Appium você envia o código Java, como uma string, para o servidor, que o executa no ambiente da aplicação, retornando o elemento ou elementos.

```js
const selector = 'new UiSelector().text("Cancel").className("android.widget.Button")'
const button = await $(`android=${selector}`)
await button.click()
```

### Android DataMatcher e ViewMatcher (somente Espresso)

A estratégia DataMatcher do Android fornece uma maneira de encontrar elementos por [Data Matcher](https://developer.android.com/reference/android/support/test/espresso/DataInteraction)

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"]
})
await menuItem.click()
```

E da mesma forma [View Matcher](https://developer.android.com/reference/android/support/test/espresso/ViewInteraction)

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"],
  "class": "androidx.test.espresso.matcher.ViewMatchers"
})
await menuItem.click()
```

### Tag de visualização do Android (somente Espresso)

A estratégia de tag de exibição fornece uma maneira conveniente de encontrar elementos por sua [tag](https://developer.android.com/reference/android/support/test/espresso/matcher/ViewMatchers.html#withTagValue%28org.hamcrest.Matcher%3Cjava.lang.Object%3E%29).

```js
const elem = await $('-android viewtag:tag_identifier')
await elem.click()
```

### iOS UIAutomation

Ao automatizar um aplicativo iOS, o [framework de automação de interface do usuário](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) da Apple pode ser usado para encontrar elementos.

Esta [API](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/index.html#//apple_ref/doc/uid/TP40009771) JavaScript tem métodos para acessar a visualização e tudo nela.

```js
const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
const button = await $(`ios=${selector}`)
await button.click()
```

Você também pode usar a pesquisa de predicados no iOS UI Automation no Appium para refinar ainda mais a seleção de elementos. Veja [aqui](https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/ios/ios-predicate.md) para mais detalhes.

### iOS XCUITest predicate strings and class chains

Com o iOS 10 e superior (usando o driver `XCUITest`), você pode usar [strings de predicado](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules):

```js
const selector = `type == 'XCUIElementTypeSwitch' && name CONTAINS 'Allow'`
const switch = await $(`-ios predicate string:${selector}`)
await switch.click()
```

E [cadeias de classes](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules):

```js
const selector = '**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton'
const button = await $(`-ios class chain:${selector}`)
await button.click()
```

### Accessibility ID

A estratégia do localizador `accessibility id` foi projetada para ler um identificador exclusivo para um elemento da interface do usuário. Isso tem a vantagem de não mudar durante a localização ou qualquer outro processo que possa alterar o texto. Além disso, pode ser uma ajuda na criação de testes multiplataforma, se elementos que são funcionalmente iguais tiverem o mesmo ID de acessibilidade.

- Para iOS, este é o `identificador de acessibilidade` definido pela Apple [aqui](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIAccessibilityIdentification_Protocol/index.html).
- Para Android, o `id de acessibilidade` mapeia para o `content-description` do elemento, conforme descrito [aqui](https://developer.android.com/training/accessibility/accessible-app.html).

Para ambas as plataformas, obter um elemento (ou vários elementos) pelo seu `id de acessibilidade` geralmente é o melhor método. Também é a maneira preferida em vez da estratégia obsoleta `name`.

```js
const elem = await $('~my_accessibility_identifier')
await elem.click()
```

### Nome da classe

A estratégia `class name` é uma `string` que representa um elemento da interface do usuário na visualização atual.

- Para iOS, é o nome completo de uma [classe UIAutomation](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) e começará com `UIA-`, como `UIATextField` para um campo de texto. Uma referência completa pode ser encontrada [aqui](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation).
- Para Android, é o nome totalmente qualificado de uma [classe](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) do UI Automator, como `android.widget.EditText` para um campo de texto. Uma referência completa pode ser encontrada [aqui](https://developer.android.com/reference/android/widget/package-summary.html).
- Para Youi.tv, é o nome completo de uma classe Youi.tv e será com `CYI-`, como `CYIPushButtonView` para um elemento de botão de pressão. Uma referência completa pode ser encontrada em [Página do GitHub do You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver)

```js
// iOS example
await $('UIATextField').click()
// Android example
await $('android.widget.DatePicker').click()
// Youi.tv example
await $('CYIPushButtonView').click()
```

## Seletores de cadeia

Se você quiser ser mais específico em sua consulta, você pode encadear seletores até encontrar o elemento certo. Se você chamar `element` antes do seu comando real, o WebdriverIO iniciará a consulta a partir desse elemento.

Por exemplo, se você tiver uma estrutura DOM como:

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

E se você quiser adicionar o produto B ao carrinho, seria difícil fazer isso apenas usando o seletor CSS.

Com o encadeamento do seletor, é muito mais fácil. Basta restringir o elemento desejado passo a passo:

```js
await $('.row .entry:nth-child(2)').$('button*=Add').click()
```

### Seletor de imagens Appium

Usando a estratégia de localização `-image`, é possível enviar a um Appium um arquivo de imagem representando um elemento que você deseja acessar.

Formatos de arquivo suportados `jpg,png,gif,bmp,svg`

A referência completa pode ser encontrada [aqui](https://github.com/appium/appium/blob/master/packages/images-plugin/docs/find-by-image.md)

```js
const elem = await $('./file/path/of/image/test.jpg')
await elem.click()
```

**Nota**: A maneira como o Appium funciona com este seletor é que ele fará internamente uma captura de tela (do aplicativo) e usará o seletor de imagem fornecido para verificar se o elemento pode ser encontrado nessa captura de tela (do aplicativo).

Esteja ciente do fato de que o Appium pode redimensionar a captura de tela (do aplicativo) para que ela corresponda ao tamanho CSS da tela do seu (do aplicativo) (isso acontecerá em iPhones, mas também em máquinas Mac com tela Retina porque o DPR é maior que 1). Isso resultará em não encontrar uma correspondência porque o seletor de imagem fornecido pode ter sido retirado da captura de tela original. Você pode corrigir isso atualizando as configurações do Appium Server. Veja a [documentação do Appium](https://github.com/appium/appium/blob/master/packages/images-plugin/docs/find-by-image.md#related-settings) para as configurações e [este comentário](https://github.com/webdriverio/webdriverio/issues/6097#issuecomment-726675579) para uma explicação detalhada.

## React Seletores

O WebdriverIO fornece uma maneira de selecionar componentes React com base no nome do componente. Para fazer isso, você pode escolher entre dois comandos: `react$` e `react$$`.

Esses comandos permitem que você selecione componentes do [React VirtualDOM](https://reactjs.org/docs/faq-internals.html) e retorne um único elemento WebdriverIO ou uma matriz de elementos (dependendo de qual função é usada).

**Observação**: os comandos `react$` e `react$$` são semelhantes em funcionalidade, exceto que `react$$` retornará *todas* as instâncias correspondentes como uma matriz de elementos WebdriverIO, e `react$` retornará a primeira instância encontrada.

#### Exemplo básico

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

No código acima, há uma instância simples de `MyComponent` dentro do aplicativo, que o React está renderizando dentro de um elemento HTML com `id="root"`.

Com o comando `browser.react$`, você pode selecionar uma instância de `MyComponent`:

```js
const myCmp = await browser.react$('MyComponent')
```

Agora que você tem o elemento WebdriverIO armazenado na variável `myCmp`, você pode executar comandos de elemento nele.

#### Filtrando componentes

A biblioteca que o WebdriverIO usa internamente permite filtrar sua seleção por propriedades e/ou estado do componente. Para fazer isso, você precisa passar um segundo argumento para props e/ou um terceiro argumento para state para o comando do navegador.

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

Se você quiser selecionar a instância de `MyComponent` que tem um prop `name` como `WebdriverIO`, você pode executar o comando assim:

```js
const myCmp = await browser.react$('MyComponent', {
    props: { name: 'WebdriverIO' }
})
```

Se você quisesse filtrar nossa seleção por estado, o comando `browser` seria parecido com isto:

```js
const myCmp = await browser.react$('MyComponent', {
    state: { myState: 'some value' }
})
```

#### Lidando com `React.Fragment`

Ao usar o comando `react$` para selecionar [fragmentos](https://reactjs.org/docs/fragments.html) do React, o WebdriverIO retornará o primeiro filho desse componente como o nó do componente. Se você usar `react$$`, receberá uma matriz contendo todos os nós HTML dentro dos fragmentos que correspondem ao seletor.

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

Dado o exemplo acima, é assim que os comandos funcionariam:

```js
await browser.react$('MyComponent') // returns the WebdriverIO Element for the first <div />
await browser.react$$('MyComponent') // returns the WebdriverIO Elements for the array [<div />, <div />]
```

**Observação:** se você tiver várias instâncias de `MyComponent` e usar `react$$` para selecionar esses componentes de fragmento, será retornado um array unidimensional de todos os nós. Em outras palavras, se você tiver 3 instâncias `<MyComponent />`, será retornado um array com seis elementos WebdriverIO.

## Estratégias de seletor personalizado


Se seu aplicativo exigir uma maneira específica de buscar elementos, você pode definir uma estratégia de seletor personalizada que pode ser usada com `custom$` e `custom$$`. Para isso, registre sua estratégia uma vez no início do teste, por exemplo, em um gancho `before`:

```js reference
https://github.com/webdriverio/example-recipes/blob/f5730428ec3605e856e90bf58be17c9c9da891de/queryElements/customStrategy.js#L2-L11
```

Dado o seguinte trecho HTML:

```html reference
https://github.com/webdriverio/example-recipes/blob/f5730428ec3605e856e90bf58be17c9c9da891de/queryElements/example.html#L8-L12
```

Então use-o chamando:

```js reference
https://github.com/webdriverio/example-recipes/blob/f5730428ec3605e856e90bf58be17c9c9da891de/queryElements/customStrategy.js#L16-L19
```

**Observação:** isso só funciona em um ambiente web no qual o comando [`execute`](/docs/api/browser/execute) pode ser executado.
