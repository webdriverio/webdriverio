import { $, expect } from '@wdio/globals'
import { render } from '@wdio/browser-runner/stencil'

import { AppProfile } from './components/StencilComponent.jsx'

describe('Stencil Component Testing', () => {
    it('should render component correctly', async () => {
        render({
            components: [AppProfile],
            template: () => (
                <app-profile match={{ params: { name: 'stencil' } }}></app-profile>
            )
        })
        await expect($('>>>.app-profile')).toHaveText('Hello! My name is Stencil.')
    })
})
