import React, { useEffect } from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { useAnnouncementBar } from '@docusaurus/theme-common/internal'
import Footer from '@theme-original/Footer'
import { MendableFloatingButton } from '@mendable/search'

const announcementBarHeightProperty = '--wdio-announcement-bar-height'

export default function FooterWrapper(props) {
    const {
        siteConfig: { customFields },
    } = useDocusaurusContext()
    const { isActive: isAnnouncementBarActive } = useAnnouncementBar()

    useEffect(() => {
        const root = document.documentElement
        const announcementBar = document.querySelector<HTMLElement>('.theme-announcement-bar')

        if (!isAnnouncementBarActive || !announcementBar) {
            root.style.removeProperty(announcementBarHeightProperty)
            return
        }

        const updateAnnouncementBarHeight = () => {
            root.style.setProperty(announcementBarHeightProperty, `${announcementBar.offsetHeight}px`)
        }
        const resizeObserver = new ResizeObserver(updateAnnouncementBarHeight)

        updateAnnouncementBarHeight()
        resizeObserver.observe(announcementBar)

        return () => {
            resizeObserver.disconnect()
            root.style.removeProperty(announcementBarHeightProperty)
        }
    }, [isAnnouncementBarActive])

    return (
        <>
            <MendableFloatingButton
                style={{
                    darkMode: true,
                    accentColor: '#EA5906',
                }}
                icon={
                    <img src="/img/materials/robot-white.svg" alt="WebdriverIO AI Copilot" width={'40px'} />
                }
                floatingButtonStyle={{
                    color: '#ffffff',
                    backgroundColor: '#EA5906',
                }}
                dialogCustomStyle={{
                    dialogTopMargin: 'var(--wdio-chat-dialog-top-margin)',
                }}
                cmdShortcutKey='j'
                anon_key={customFields.mendableAnonKey as string}
                dismissPopupAfter={5}
                dialogPlaceholder='Why Webdriver.IO?'
                welcomeMessage='Welcome! How can I help?'
            />
            <Footer {...props} />
        </>
    )
}
