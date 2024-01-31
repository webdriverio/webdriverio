import React from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'
import { useColorMode } from '@docusaurus/theme-common'

export function ImageSwitcher ({ lightImageSrc, darkImageSrc, alt, link, ...args }) {
    return <BrowserOnly>
        {() => {
            const { isDarkTheme } = useColorMode()

            if (link) {
                return (
                    <a href={link}>
                        <img src={isDarkTheme ? darkImageSrc : lightImageSrc} alt={alt} {...args} />
                    </a>
                )
            }

            return (
                <img src={isDarkTheme ? darkImageSrc : lightImageSrc} alt={alt} {...args} />
            )
        }}
    </BrowserOnly>
}

export default ImageSwitcher
