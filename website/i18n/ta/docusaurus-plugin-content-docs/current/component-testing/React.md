---
id: react
title: React
---

[ React ](https://reactjs.org/) இன்டராக்டிவ் UIகளை உருவாக்குவதை வலியற்றதாக்குகிறது. உங்கள் அப்ளிகேஷனில் உள்ள ஒவ்வொரு ஸ்டேட்டிற்கும் எளிமையான காட்சிகளை வடிவமைத்து, உங்கள் டேட்டா மாறும்போது ரியாக்ட் திறமையாகப் புதுப்பித்துச் சரியான காம்போனென்டுகளை வழங்கும். WebdriverIO மற்றும் அதன் [browser runner](/docs/runner#browser-runner)யை பயன்படுத்தி உண்மையான பிரௌசரில் நேரடியாக ரியாக்ட் காம்போனென்டுகளை சோதிக்கலாம்.

## செட்அப்

உங்கள் ரியாக்ட் ப்ரொஜெக்ட்டில் WebdriverIO ஐ அமைக்க, எங்கள் காம்போனென்ட் டெஸ்ட் ஆவணத்தின் </a>instructions

 வழிமுறைகளைப் பின்பற்றவும். உங்கள் ரன்னர் விருப்பங்களுக்குள் `react` முன்னமைவாகத் தேர்ந்தெடுக்கவும், எ.கா.:</p> 



```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'react'
    }],
    // ...
}
```


:::info

நீங்கள் ஏற்கனவே [Vite](https://vitejs.dev/) யை டெவலப்மென்ட் சர்வராகப் பயன்படுத்துகிறீர்கள் என்றால், உங்கள் WebdriverIO கட்டமைப்பிற்குள் `vite.config.ts` இல் உங்கள் கட்டமைப்பை மீண்டும் பயன்படுத்தலாம். மேலும் தகவலுக்கு, `viteConfig` இன் [runner options](/docs/runner#runner-options)ஐப் பார்க்கவும்.

:::  

ரியாக்ட் முன்னமைவுக்கு `@vitejs/plugin-react` நிறுவப்பட வேண்டும். டெஸ்ட் பக்கத்தில் காம்போனென்டுகளை வழங்குவதற்கு [Testing Library](https://testing-library.com/) ஐப் பயன்படுத்தவும் பரிந்துரைக்கிறோம். எனவே நீங்கள் பின்வரும் கூடுதல் சார்புகளை நிறுவ வேண்டும்:



```sh npm2yarn
npm install --save-dev @testing-library/react @vitejs/plugin-react
```


பின்னர் நீங்கள் டெஸ்டுகளை ரன் செய்வதன் மூலம் தொடங்கலாம்:



```sh
npx wdio run ./wdio.conf.js
```




## டெஸ்டுகளை எழுதுதல்

உங்களிடம் பின்வரும் React காம்போனென்ட் உள்ளது:



```tsx title="./components/Component.jsx"
import React, { useState } from 'react'

function App() {
    const [theme, setTheme] = useState('light')

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(nextTheme)
    }

    return <button onClick={toggleTheme}>
        Current theme: {theme}
    </button>
}

export default App
```


உங்கள் டெஸ்டில் `@testing-library/react` இலிருந்து ` render ` மெத்தடை பயன்படுத்தி டெஸ்ட் பக்கத்துடன் காம்போனென்டுகளை இணைக்கவும். காம்போனென்டுகளுடன் தொடர்பு கொள்ள WebdriverIO கட்டளைகளைப் பயன்படுத்தப் பரிந்துரைக்கிறோம், ஏனெனில் அவை உண்மையான பயனர் தொடர்புகளுக்கு மிகவும் நெருக்கமாகச் செயல்படுகின்றன, எ.கா.:



```ts title="app.test.tsx"
import { expect } from '@wdio/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

import App from './components/Component.jsx'

describe('React Component Testing', () => {
    it('Test theme button toggle', async () => {
        render(<App />)
        const buttonEl = screen.getByText(/Current theme/i)

        await $(buttonEl).click()
        expect(buttonEl).toContainHTML('dark')
    })
})
```


React க்கான WebdriverIO காம்போனென்ட் டெஸ்ட் தொகுப்பின் முழு உதாரணத்தையும் எங்களின் [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/react-typescript-vite)இல் காணலாம்.

