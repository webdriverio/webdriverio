---
id: preact
title: Preact
---

[Preact](https://preactjs.com/) ist eine schnelle 3kB-Alternative zu React mit derselben modernen API. Mit WebdriverIO und seinem [Browser Runner](/docs/runner#browser-runner)können Sie Preact-Komponenten direkt in einem echten Browser testen.

## Setup

Um WebdriverIO in Ihrem Preact-Projekt einzurichten, befolgen Sie die [Anweisungen](/docs/component-testing#set-up) in unseren Komponententestdokumenten. Stellen Sie sicher, dass Sie `Preact` als Voreinstellung in Ihren Runner-Optionen auswählen, z. B.:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'preact'
    }],
    // ...
}
```

:::info

Wenn Sie bereits [Vite](https://vitejs.dev/) als Entwicklungsserver verwenden, können Sie auch einfach Ihre Konfiguration in `vite.config.ts` in Ihrer WebdriverIO-Konfiguration wiederverwenden. Weitere Informationen finden Sie unter `viteConfig` in [Runner-Optionen](/docs/runner#runner-options).

:::

Für die Preact-Voreinstellung muss `@preact/preset-vite` installiert sein. Außerdem empfehlen wir die Verwendung von [Testing Library](https://testing-library.com/) zum Rendern der Komponente auf der Testseite. Dazu müssen Sie die folgenden zusätzlichen Abhängigkeiten installieren:

```sh npm2yarn
npm install --save-dev @testing-library/preact @preact/preset-vite
```

Sie können die Tests dann starten, indem Sie Folgendes ausführen:

```sh
npx wdio run ./wdio.conf.js
```

## Tests schreiben

Vorausgesetzt, Sie haben die folgende Preact-Komponente:

```tsx title="./components/Component.jsx"
import { h } from 'preact'
import { useState } from 'preact/hooks'

interface Props {
    initialCount: number
}

export function Counter({ initialCount }: Props) {
    const [count, setCount] = useState(initialCount)
    const increment = () => setCount(count + 1)

    return (
        <div>
            Current value: {count}
            <button onClick={increment}>Increment</button>
        </div>
    )
}

```

Verwenden Sie in Ihrem Test die Methode `render` aus `@testing-library/preact` , um die Komponente an die Testseite anzuhängen. Um mit der Komponente zu interagieren, empfehlen wir die Verwendung von WebdriverIO-Befehlen, da sie sich näher an tatsächlichen Benutzerinteraktionen verhalten, z.B.:

```ts title="app.test.tsx"
import { expect } from 'expect'
import { render, screen } from '@testing-library/preact'

import { Counter } from './components/PreactComponent.js'

describe('Preact Component Testing', () => {
    it('should increment after "Increment" button is clicked', async () => {
        const component = await $(render(<Counter initialCount={5} />))
        await expect(component).toHaveTextContaining('Current value: 5')

        const incrElem = await $(screen.getByText('Increment'))
        await incrElem.click()
        await expect(component).toHaveTextContaining('Current value: 6')
    })
})
```

Ein vollständiges Beispiel einer Testsuite für WebdriverIO-Komponenten für Preact finden Sie in unserem [-Beispiel-Repository](https://github.com/webdriverio/component-testing-examples/tree/main/react-typescript-vite).
