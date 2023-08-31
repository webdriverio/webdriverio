import React from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Footer from '@theme-original/Footer'
import { MendableFloatingButton } from '@mendable/search'

export default function FooterWrapper(props) {
    const {
        siteConfig: { customFields },
    } = useDocusaurusContext()

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
                    dialogTopMargin: '64px',
                }}
                cmdShortcutKey='j'
                anon_key={customFields.mendableAnonKey}
                dismissPopupAfter={5}
                dialogPlaceholder='Why Webdriver.IO?'
                welcomeMessage='Welcome! How can I help?'
            />
            <Footer {...props} />
        </>
    )
}
