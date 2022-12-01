import React from 'react'
import { useColorMode } from '@docusaurus/theme-common'

export default function CreateProjectAnimation () {
    const { colorMode } = useColorMode()
    const src = colorMode === 'dark'
        ? '/img/create-wdio-dark.gif'
        : '/img/create-wdio-light.gif'

    return (
        <img src={src} style={{ margin: '0 auto', display: 'block' }} alt="Create WebdriverIO Demo" />
    )
}
