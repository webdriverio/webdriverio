---
id: element
title: O objeto elemento
---

Um Objeto Elemento é um objeto que representa um elemento no agente de usuário remoto, por exemplo, um [Nó DOM](https://developer.mozilla.org/en-US/docs/Web/API/Element) ao executar uma sessão em um navegador ou [um elemento móvel](https://developer.apple.com/documentation/swift/sequence/element) para dispositivos móveis. Ele pode ser recebido usando um dos muitos comandos de consulta de elementos, por exemplo, [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) ou [`shadow$`](/docs/api/element/shadow$).

## Propriedades

Um objeto elemento tem as seguintes propriedades:

| Nome        | Tipo     | Detalhes                                                                                                                                                                                                                                                |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId` | `String` | ID de sessão atribuído pelo servidor remoto.                                                                                                                                                                                                            |
| `elementId` | `String` | [referência de elemento da web](https://w3c.github.io/webdriver/#elements) associada que pode ser usada para interagir com o elemento no nível do protocolo                                                                                             |
| `selector`  | `String` | [Seletor](/docs/selectors) usado para consultar o elemento.                                                                                                                                                                                             |
| `parent`    | `Object` | Ou o [Browser Object](/docs/api/browser) quando o elemento foi obtido dele (por exemplo, `const elem = browser.$('selector')`) ou um [Element Object](/docs/api/element) se ele foi obtido de um escopo de elemento (por exemplo, `elem.$('selector')`) |
| `options`   | `Object` | [opções](/docs/configuration) do WebdriverIO dependendo de como o objeto do navegador foi criado. Veja mais [tipos de configuração](/docs/setuptypes).                                                                                                  |

## Metódos
Um objeto de elemento fornece todos os métodos da seção de protocolo, por exemplo, o protocolo [WebDriver](/docs/api/webdriver), bem como os comandos listados na seção de elemento. Os comandos de protocolo disponíveis dependem do tipo de sessão. Se você executar uma sessão automatizada do navegador, nenhum dos [comandos](/docs/api/appium) do Appium estará disponível e vice-versa.

Além disso, os seguintes comandos estão disponíveis:

| Nome               | Parâmetros                                                            | Detalhes                                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Permite definir comandos personalizados que podem ser chamados a partir do objeto do navegador para fins de composição. Leia mais no guia [Comando personalizado](/docs/customcommands).                                                       |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Permite substituir qualquer comando do navegador com funcionalidade personalizada. Use com cuidado, pois pode confundir os usuários do framework. Leia mais no guia [Comando personalizado](/docs/customcommands#overwriting-native-commands). |

## Observações

### Cadeia de Elementos

Ao trabalhar com elementos, o WebdriverIO fornece uma sintaxe especial para simplificar a consulta e compor pesquisas de elementos aninhados complexos. Como os objetos de elemento permitem que você encontre elementos dentro de seus ramos de árvore usando métodos de consulta comuns, os usuários podem buscar elementos aninhados da seguinte maneira:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

Com estruturas aninhadas profundas, atribuir qualquer elemento aninhado a uma matriz para depois usá-lo pode ser bastante prolixo. Portanto, o WebdriverIO tem o conceito de consultas de elementos encadeados que permitem buscar elementos aninhados como este:

```js
console.log(await $('#header').$('#headline').getText())
```

Isso também funciona ao buscar um conjunto de elementos, por exemplo:

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

Ao trabalhar com um conjunto de elementos, isso pode ser especialmente útil ao tentar interagir com eles, então, em vez de fazer:

```js
const elems = await $$('div')
const locations = await Promise.all(
    elems.map((el) => el.getLocation())
)
```

Você pode chamar métodos Array diretamente na cadeia de elementos, por exemplo:

```js
const location = await $$('div').map((el) => el.getLocation())
```

o mesmo que:

```js
const divs = await $$('div')
const location = await divs.map((el) => el.getLocation())
```

O WebdriverIO usa uma implementação personalizada que oferece suporte a iteradores assíncronos, de modo que todos os comandos de sua API também são suportados para esses casos de uso.

__Observação:__ todos os iteradores assíncronos retornam uma promessa, mesmo que seu retorno de chamada não retorne uma, por exemplo:

```ts
const divs = await $$('div')
console.log(divs.map((div) => div.selector)) // ❌ retorna "Promise<string>[]"
console.log(await divs.map((div) => div.selector)) // ✅ retorna "string[]"
```

### Comandos personalizados

Você pode definir comandos personalizados no escopo do navegador para abstrair fluxos de trabalho comumente usados. Confira nosso guia sobre [Comandos personalizados](/docs/customcommands#adding-custom-commands) para obter mais informações.
