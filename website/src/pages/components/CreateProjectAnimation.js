import React from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'
import { translate } from '@docusaurus/Translate'
import { useColorMode } from '@docusaurus/theme-common'

export default function CreateProjectAnimation () {
    return (
        <BrowserOnly>
            {() => {
                const { colorMode } = useColorMode()
                const src = colorMode === 'dark'
                    ? '/img/create-wdio-dark.gif'
                    : '/img/create-wdio-light.gif'
                return (
                    <img
                        src={src}
                        style={{ margin: '0 auto', display: 'block' }}
                        alt={translate({
                            id: 'homepage.createBrowserAnimation',
                            message: 'Create WebdriverIO Demo'
                        })}
                    />
                )
            }}
        </BrowserOnly>
    )
}
