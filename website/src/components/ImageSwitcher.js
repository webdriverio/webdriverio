import React from 'react'
import { useColorMode } from '@docusaurus/theme-common'

export function ImageSwitcher ({ lightImageSrc, darkImageSrc, alt, link }) {
    const { isDarkTheme } = useColorMode()

    if (link) {
        return (
            <a href={link}>
                <img src={isDarkTheme ? darkImageSrc : lightImageSrc} alt={alt} />
            </a>
        )
    }

    return (
        <img src={isDarkTheme ? darkImageSrc : lightImageSrc} alt={alt} />
    )
}
