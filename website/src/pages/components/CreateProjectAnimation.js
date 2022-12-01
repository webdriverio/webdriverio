import React from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'

export default function CreateProjectAnimation () {
    return (
        <BrowserOnly>
            {() => {
                // eslint-disable-next-line no-undef
                const theme = document.querySelector('html').getAttribute('data-theme')
                const src = theme === 'dark'
                    ? '/img/create-wdio-dark.gif'
                    : '/img/create-wdio-light.gif'
                return (
                    <img src={src} style={{ margin: '0 auto', display: 'block' }} alt="Create WebdriverIO Demo" />
                )
            }}
        </BrowserOnly>
    )
}
