import React from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'
import { translate } from '@docusaurus/Translate'
import { useColorMode } from '@docusaurus/theme-common'
import type { FC } from 'react'

const CreateProjectAnimation: FC = () => (
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

export default CreateProjectAnimation
