---
id: solid
title: SolidJS
---

[SolidJS](https://www.solidjs.com/) என்பது எளிமையான மற்றும் செயல்திறன் மிக்க வினைத்திறனுடன் பயனர் இடைமுகங்களை உருவாக்குவதற்கான ஒரு கட்டமைப்பாகும். WebdriverIO மற்றும் அதன் [browser runner](/docs/runner#browser-runner) பயன்படுத்தி SolidJS காம்போனென்டுகளை உண்மையான பிரௌசரில் நேரடியாகச் சோதிக்கலாம்.

## செட்அப்

உங்கள் ரியாக்ட் ப்ரொஜெக்ட்டில் WebdriverIO ஐ அமைக்க, எங்கள் காம்போனென்ட் டெஸ்ட் ஆவணத்தின் </a>instructions

 வழிமுறைகளைப் பின்பற்றவும். உங்கள் ரன்னர் விருப்பங்களில் `solid` முன்னமைவாகத் தேர்ந்தெடுக்கவும், எ.கா.:</p> 



```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'solid'
    }],
    // ...
}
```


:::info

நீங்கள் ஏற்கனவே [Vite](https://vitejs.dev/) டெவலப்மென்ட் சர்வராகப் பயன்படுத்துகிறீர்கள் என்றால், உங்கள் WebdriverIO கட்டமைப்பிற்குள் `vite.config.ts` இல் உங்கள் கட்டமைப்பை மீண்டும் பயன்படுத்தலாம். மேலும் தகவலுக்கு, `viteConfig` இன் [ரன்னர் விருப்பங்கள்](/docs/runner#runner-options)ஐப் பார்க்கவும்.

:::  

SolidJS முன்னமைவுக்கு `vite-plugin-solid` நிறுவப்பட வேண்டும்:



```sh npm2yarn
npm install --save-dev vite-plugin-solid
```


பின்னர் நீங்கள் டெஸ்டுகளை ரன் செய்வதன் மூலம் தொடங்கலாம்:



```sh
npx wdio run ./wdio.conf.js
```




## டெஸ்டுகளை எழுதுதல்

பின்வரும் SolidJS கூறு உங்களிடம் இருப்பதால்:



```html title="./components/Component.tsx"
import { createSignal } from 'solid-js'

function App() {
    const [theme, setTheme] = createSignal('light')

    const toggleTheme = () => {
        const nextTheme = theme() === 'light' ? 'dark' : 'light'
        setTheme(nextTheme)
    }

    return <button onClick={toggleTheme}>
        Current theme: {theme()}
    </button>
}

export default App
```


உங்கள் டெஸ்டில் `solid-js/web` இலிருந்து ` render ` முறையைப் பயன்படுத்தி டெஸ்ட் பக்கத்துடன் காம்போனென்டுகளை இணைக்கவும். காம்போனென்டுகளுடன் தொடர்பு கொள்ள WebdriverIO கட்டளைகளைப் பயன்படுத்தப் பரிந்துரைக்கிறோம், ஏனெனில் அவை உண்மையான பயனர் தொடர்புகளுக்கு மிகவும் நெருக்கமாகச் செயல்படுகின்றன, எ.கா.:



```ts title="app.test.tsx"
import { expect } from '@wdio/globals'
import { render } from 'solid-js/web'

import App from './components/Component.jsx'

describe('React Component Testing', () => {
    /**
     * ensure we render the component for every test in a
     * new root container
     */
    let root: Element
    beforeEach(() => {
        if (root) {
            root.remove()
        }

        root = document.createElement('div')
        document.body.appendChild(root)
    })

    it('Test theme button toggle', async () => {
        render(<App />, root)
        const buttonEl = await $('button')

        await buttonEl.click()
        expect(buttonEl).toContainHTML('dark')
    })
})
```


SolidJS க்கான WebdriverIO காம்போனென்ட் டெஸ்ட் தொகுப்பின் முழு உதாரணத்தையும் எங்களின் [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/solidjs-typescript-vite)இல் காணலாம்.

