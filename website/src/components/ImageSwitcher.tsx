import React from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'
import { useColorMode } from '@docusaurus/theme-common'

export function ImageSwitcher ({ lightImageSrc, target, darkImageSrc, alt, link, ...args }) {
    return <BrowserOnly>
        {() => {
            const { isDarkTheme } = useColorMode()

            if (link) {
                return (
                    <a href={link} target={target || '_self'}>
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
