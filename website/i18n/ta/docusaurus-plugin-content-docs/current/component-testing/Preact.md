---
id: preact
title: Preact
---

[Preact](https://preactjs.com/) என்பது நவீன API உடன் ரியாக்ட் செய்வதற்கு வேகமான 3kB மாற்றாகும். WebdriverIO மற்றும் அதன் [ browser runner ](/docs/runner#browser-runner)பயன்படுத்தி உண்மையான பிரௌசரில் நேரடியாக Preact காம்போனென்டுகளை சோதிக்கலாம்.

## செட்அப்

உங்கள் Preact ப்ரொஜெக்ட்டில் WebdriverIO ஐ அமைக்க, எங்கள் காம்போனென்ட் டெஸ்ட் ஆவணத்தின் </a>instructions

 வழிமுறைகளைப் பின்பற்றவும். உங்கள் ரன்னர் விருப்பங்களுக்குள் `preact` முன்னமைவாகத் தேர்ந்தெடுக்கவும், எ.கா.:</p> 



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

நீங்கள் ஏற்கனவே [Vite](https://vitejs.dev/) டெவலப்மென்ட் சர்வராகப் பயன்படுத்துகிறீர்கள் என்றால், உங்கள் WebdriverIO கட்டமைப்பிற்குள் `vite.config.ts` இல் உங்கள் கட்டமைப்பை மீண்டும் பயன்படுத்தலாம். மேலும் தகவலுக்கு, `viteConfig` இன் [ரன்னர் விருப்பங்கள்](/docs/runner#runner-options)ஐப் பார்க்கவும்.

:::  

ரியாக்ட் முன்னமைவுக்கு `@preact/preset-vite` ஐ நிறுவ வேண்டும். டெஸ்ட் பக்கத்தில் காம்போனென்டுகளை வழங்குவதற்கு [Testing Library](https://testing-library.com/) ஐப் பயன்படுத்தவும் பரிந்துரைக்கிறோம். எனவே நீங்கள் பின்வரும் கூடுதல் சார்புகளை நிறுவ வேண்டும்:



```sh npm2yarn
npm install --save-dev @testing-library/preact @preact/preset-vite
```


பின்னர் நீங்கள் டெஸ்டுகளை ரன் செய்வதன் மூலம் தொடங்கலாம்:



```sh
npx wdio run ./wdio.conf.js
```




## டெஸ்டுகளை எழுதுதல்

உங்களிடம் பின்வரும் Preact காம்போனென்ட் உள்ளது:



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


உங்கள் டெஸ்டில் `@testing-library/preact` இலிருந்து ` render ` மெத்தடை பயன்படுத்தி டெஸ்ட் பக்கத்துடன் காம்போனென்டுகளை இணைக்கவும். காம்போனென்டுகளுடன் தொடர்பு கொள்ள WebdriverIO கட்டளைகளைப் பயன்படுத்தப் பரிந்துரைக்கிறோம், ஏனெனில் அவை உண்மையான பயனர் தொடர்புகளுக்கு மிகவும் நெருக்கமாகச் செயல்படுகின்றன, எ.கா.:



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


React க்கான WebdriverIO காம்போனென்ட் டெஸ்ட் தொகுப்பின் முழு உதாரணத்தையும் எங்களின் [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/react-typescript-vite)இல் காணலாம்.
