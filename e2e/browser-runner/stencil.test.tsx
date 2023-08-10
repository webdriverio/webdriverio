import * as foo from '@stencil/core'
// import { expect } from '@wdio/globals'

// import './components/StencilJS.jsx'

describe('React Component Testing', () => {
    it('Test theme button toggle', async () => {
        console.log(foo);

        const stage = document.createElement('div')
        stage.innerHTML = '<my-component></my-component>'
        document.body.appendChild(stage)
        await browser.pause(5000)
    })
})
