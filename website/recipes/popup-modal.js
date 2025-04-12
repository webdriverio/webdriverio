import { browser } from '@wdio/globals'
import { defineConfig } from '@wdio/config'

import { openExtensionPopup } from './support/customCommands'

export const config = defineConfig({
    // ...
    before: () => {
        browser.addCommand('openExtensionPopup', openExtensionPopup)
    }
})