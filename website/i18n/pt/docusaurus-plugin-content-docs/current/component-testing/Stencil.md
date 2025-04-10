---
id: stencil
title: Stencil
---

[Stencil](https://stenciljs.com/) é uma biblioteca para criar bibliotecas de componentes reutilizáveis ​​e escaláveis. Você pode testar componentes do Stencil diretamente em um navegador real usando o WebdriverIO e seu [executor do navegador](/docs/runner#browser-runner).

## Configurar

Para configurar o WebdriverIO no seu projeto Stencil, siga as [instruções](/docs/component-testing#set-up) em nossos documentos de teste de componentes. Certifique-se de selecionar `stencil` como predefinição nas opções do seu runner, por exemplo:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'stencil'
    }],
    // ...
}
```

:::info

Caso você use o Stencil com um framework como React ou Vue, você deve manter as predefinições para esses frameworks.

:::

Você pode então iniciar os testes executando:

```sh
npx wdio run ./wdio.conf.ts
```

## Escrevendo testes

Considerando que você tem os seguintes componentes do Stencil:

```tsx title="./components/Component.tsx"
import { Component, Prop, h } from '@stencil/core'

@Component({
    tag: 'my-name',
    shadow: true
})
export class MyName {
    @Prop() name: string

    normalize(name: string): string {
        if (name) {
            return name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase()
        }
        return ''
    }

    render() {
        return (
            <div class="text">
                <p>Hello! My name is {this.normalize(this.name)}.</p>
            </div>
        )
    }
}
```

### `render`

No seu teste, use o método `render` de `@wdio/browser-runner/stencil` para anexar o componente à página de teste. Para interagir com o componente, recomendamos usar comandos WebdriverIO, pois eles se comportam mais próximos das interações reais do usuário, por exemplo:

```tsx title="app.test.tsx"
import { expect } from '@wdio/globals'
import { render } from '@wdio/browser-runner/stencil'

import MyNameComponent from './components/Component.tsx'

describe('Stencil Component Testing', () => {
    it('should render component correctly', async () => {
        await render({
            components: [MyNameComponent],
            template: () => (
                <my-name name={'stencil'}></my-name>
            )
        })
        await expect($('.text')).toHaveText('Hello! My name is Stencil.')
    })
})
```

#### Opções de renderização

O método `render` fornece as seguintes opções:

##### `componentes`

Uma série de componentes para testar. As classes de componentes podem ser importadas para o arquivo de especificação e, em seguida, sua referência deve ser adicionada ao array `component` para ser usada durante o teste.

__Tipo:__ `CustomElementConstructor[]`<br />

##### `flushQueue`

Se `false`, não esvazie a fila de renderização na configuração de teste inicial.

__Type:__ `boolean`<br /> __Default:__ `true`

##### `template`

O JSX inicial usado para gerar o teste. Use `template` quando quiser inicializar um componente usando suas propriedades, em vez de seus atributos HTML. Ele renderizará o modelo especificado (JSX) em `document.body`.

__Type:__ `JSX.Template`

##### `html`

O HTML inicial usado para gerar o teste. Isso pode ser útil para construir uma coleção de componentes trabalhando juntos e atribuir atributos HTML.

__Type:__ `string`

##### `language`

Define o atributo `lang` simulado em `<html>`.

__Type:__ `string`

##### `autoApplyChanges`

Por padrão, quaisquer alterações nas propriedades e atributos do componente devem `env.waitForChanges()` para testar as atualizações. Como opção, `autoApplyChanges` limpa continuamente a fila em segundo plano.

__Tipo:__ `boolean`<br /> __Padrão:__ `false`

##### `attachStyles`

Por padrão, os estilos não são anexados ao DOM e não são refletidos no HTML serializado. Definir esta opção como `true` incluirá os estilos do componente na saída serializável.

__Type:__ `boolean`<br /> __Default:__ `false`

#### Renderizar ambiente

O método `render` retorna um objeto de ambiente que fornece certos auxiliares utilitários para gerenciar o ambiente do componente.

##### `flushAll`

Após alterações feitas em um componente, como uma atualização de uma propriedade ou atributo, a página de teste não aplica as alterações automaticamente. Para aguardar e aplicar a atualização, chame `await flushAll()`

__Tipo:__ `() => void`

##### `unmount`

Remove o elemento container do DOM.

__Tipo:__ `() => void`

##### `styles`

Todos os estilos definidos por componentes.

__Type:__ `Record<string, string>`

##### `container`

Elemento de contêiner no qual o modelo está sendo renderizado.

__Type:__ `HTMLElement`

##### `$container`

O elemento container como um elemento WebdriverIO.

__Type:__ `WebdriverIO.Element`

##### `root`

O componente raiz do modelo.

__Type:__ `HTMLElement`

##### `$root`

O componente raiz como um elemento WebdriverIO.

__Type:__ `WebdriverIO.Element`

### `waitForChanges`

Método auxiliar para aguardar o componente ficar pronto.

```ts
import { render, waitForChanges } from '@wdio/browser-runner/stencil'
import { MyComponent } from './component.tsx'

const page = render({
    components: [MyComponent],
    html: '<my-component></my-component>'
})

expect(page.root.querySelector('div')).not.toBeDefined()
await waitForChanges()
expect(page.root.querySelector('div')).toBeDefined()
```

## Atualizações de elementos

Se você definir propriedades ou estados no seu componente Stencil, precisará gerenciar quando essas alterações devem ser aplicadas ao componente a ser renderizado novamente.


## Exemplos

Você pode encontrar um exemplo completo de um conjunto de testes de componentes WebdriverIO para Stencil em nosso [repositório de exemplos](https://github.com/webdriverio/component-testing-examples/tree/main/stencil-component-starter).

