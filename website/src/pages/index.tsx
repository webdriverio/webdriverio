import React from 'react'
import clsx from 'clsx'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import Translate, { translate } from '@docusaurus/Translate'

import PlatformDiagram from '../components/home/PlatformDiagram.tsx'
import InstallCommand from '../components/home/InstallCommand.tsx'
import Platforms from '../components/home/Platforms.tsx'
import AgentDemo from '../components/home/AgentDemo.tsx'
import DevToolsDemo from '../components/home/DevToolsDemo.tsx'
import LogoCarousel from '../components/LogoCarousel.tsx'
import Sponsors from '../components/Sponsors.tsx'
import ContributorList from '../components/Contributors/Contributors.tsx'
import { logos } from '../constants.tsx'

import styles from '../components/home/home.module.css'

const tagline = translate({
    id: 'homepage.tagline',
    message: 'Open source test automation for web, mobile and desktop apps'
})

function SectionHeader ({ eyebrow, title, children }: { eyebrow: string, title: string, children?: React.ReactNode }) {
    return (
        <div className={styles.sectionHeader}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h2>{title}</h2>
            {children && <p>{children}</p>}
        </div>
    )
}

function Feature ({ title, children, to }: { title: string, children: React.ReactNode, to?: string }) {
    const content = (
        <>
            <h3>{title}</h3>
            <p>{children}</p>
        </>
    )
    return to
        ? <Link to={to} className={clsx(styles.feature, styles.featureLink)}>{content}</Link>
        : <div className={styles.feature}>{content}</div>
}

export default function Home () {
    return (
        <Layout title={`WebdriverIO · ${tagline}`} description={tagline}>
            <main className={styles.home}>
                <header className={clsx(styles.frame, styles.hero)}>
                    <div className={styles.heroText}>
                        <Link to="/community/support" className={styles.badge}>
                            <span className={styles.badgeDot} />
                            <Translate id="homepage.hero.badge">Community driven · OpenJS Foundation</Translate>
                        </Link>
                        <h1 className={styles.heroTitle}>
                            <Translate id="homepage.hero.title">One framework to test every platform your users are on</Translate>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            <Translate id="homepage.hero.subtitle">
                                Browsers, native and hybrid mobile apps, desktop apps, VS Code extensions and visual regressions,
                                all with one API. Built on web standards, openly governed, and ready for your coding agent.
                            </Translate>
                        </p>
                        <div className={styles.heroActions}>
                            <Link className={clsx('button button--primary button--lg', styles.primaryButton)} to="/docs/gettingstarted">
                                <Translate id="homepage.getStarted">Get Started</Translate>
                            </Link>
                            <Link className={clsx('button button--lg', styles.secondaryButton)} to="/docs/ai-agents">
                                <Translate id="homepage.hero.agents">Set up with your agent</Translate>
                            </Link>
                        </div>
                        <InstallCommand />
                    </div>
                    <div className={styles.heroVisual}>
                        <PlatformDiagram />
                    </div>
                </header>

                <section className={clsx(styles.frame, styles.section)}>
                    <SectionHeader
                        eyebrow={translate({ id: 'homepage.platforms.eyebrow', message: 'One API' })}
                        title={translate({ id: 'homepage.platforms.heading', message: 'Write it once. Run it on every platform.' })}>
                        <Translate id="homepage.platforms.description">
                            The same test runner, selectors, assertions and reporters, whether you are testing a web app, a phone, a desktop app or an editor extension.
                        </Translate>
                    </SectionHeader>
                    <Platforms />
                </section>

                <section className={clsx(styles.frame, styles.section, styles.split)}>
                    <div>
                        <SectionHeader
                            eyebrow={translate({ id: 'homepage.agents.eyebrow', message: 'AI-native' })}
                            title={translate({ id: 'homepage.agents.heading', message: 'Built for coding agents' })}>
                            <Translate id="homepage.agents.description">
                                Most tests are now written together with an agent. WebdriverIO gives it everything it needs to write, run and fix them on its own.
                            </Translate>
                        </SectionHeader>
                        <div className={styles.featureList}>
                            <Feature to="/docs/mcp" title={translate({ id: 'homepage.agents.mcp.title', message: 'WebdriverIO MCP' })}>
                                <Translate id="homepage.agents.mcp.text">Let agents drive browsers and mobile apps to explore your UI and find robust selectors.</Translate>
                            </Feature>
                            <Feature to="/docs/ai-agents" title={translate({ id: 'homepage.agents.docs.title', message: 'Agent-ready docs' })}>
                                <Translate id="homepage.agents.docs.text">Every page as Markdown, llms.txt, per-section bundles and a docs MCP server at webdriver.io/mcp.</Translate>
                            </Feature>
                            <Feature to="/docs/devtools/wdio/trace-mode" title={translate({ id: 'homepage.agents.traces.title', message: 'Traces agents can read' })}>
                                <Translate id="homepage.agents.traces.text">Failing tests leave a Markdown transcript, screenshots and accessibility snapshots behind.</Translate>
                            </Feature>
                        </div>
                    </div>
                    <AgentDemo />
                </section>

                <section className={clsx(styles.frame, styles.section, styles.split, styles.splitReverse)}>
                    <DevToolsDemo />
                    <div>
                        <SectionHeader
                            eyebrow={translate({ id: 'homepage.devtools.eyebrow', message: 'Debugging' })}
                            title={translate({ id: 'homepage.devtools.heading', message: 'See exactly what your test did' })}>
                            <Translate id="homepage.devtools.description">
                                WebdriverIO DevTools shows every command, network request, console message and screenshot of a run. Watch tests live and rerun single tests with a click, or record portable traces in CI and replay them later.
                            </Translate>
                        </SectionHeader>
                        <div className={styles.featureList}>
                            <Feature to="/docs/devtools/dashboard" title={translate({ id: 'homepage.devtools.live.title', message: 'Live mode' })}>
                                <Translate id="homepage.devtools.live.text">An interactive dashboard that opens while your tests run.</Translate>
                            </Feature>
                            <Feature to="/docs/devtools/wdio/trace-mode" title={translate({ id: 'homepage.devtools.trace.title', message: 'Trace mode' })}>
                                <Translate id="homepage.devtools.trace.text">A trace.zip per session, spec or test for offline replay.</Translate>
                            </Feature>
                            <Feature to="/docs/devtools/cross-framework" title={translate({ id: 'homepage.devtools.frameworks.title', message: 'Not only WebdriverIO' })}>
                                <Translate id="homepage.devtools.frameworks.text">Also works with Selenium WebDriver and Nightwatch.js.</Translate>
                            </Feature>
                        </div>
                    </div>
                </section>

                <section className={clsx(styles.frame, styles.section)}>
                    <SectionHeader
                        eyebrow={translate({ id: 'homepage.community.eyebrow', message: 'Open source' })}
                        title={translate({ id: 'homepage.community.heading', message: 'Community driven. Openly governed.' })}>
                        <Translate id="homepage.community.description">
                            WebdriverIO is not a product of a testing company. It is run by its community under the umbrella of the OpenJS Foundation, so its direction follows the needs of its users.
                        </Translate>
                    </SectionHeader>
                    <div className={styles.grid4}>
                        <Feature to="https://openjsf.org/projects" title={translate({ id: 'homepage.community.openjs.title', message: 'OpenJS Foundation' })}>
                            <Translate id="homepage.community.openjs.text">Owned by a vendor-neutral non-profit, next to Node.js, Electron and webpack.</Translate>
                        </Feature>
                        <Feature to="https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md" title={translate({ id: 'homepage.community.governance.title', message: 'Open governance' })}>
                            <Translate id="homepage.community.governance.text">A public governance model: anyone can contribute, and committers and the TSC grow out of the community.</Translate>
                        </Feature>
                        <Feature title={translate({ id: 'homepage.community.free.title', message: 'Every feature is free' })}>
                            <Translate id="homepage.community.free.text">No paid tier, no feature gates, no lock-in to a cloud vendor. Run anywhere.</Translate>
                        </Feature>
                        <Feature to="/blog/2024/02/15/new-contributor-stipend-program" title={translate({ id: 'homepage.community.stipend.title', message: 'Paid contributors' })}>
                            <Translate id="homepage.community.stipend.text">Sponsorship money flows back to contributors through the stipend program.</Translate>
                        </Feature>
                    </div>
                    <div className={styles.contributors}>
                        <ContributorList />
                    </div>
                </section>

                <section className={clsx(styles.frame, styles.section)}>
                    <SectionHeader
                        eyebrow={translate({ id: 'homepage.standards.eyebrow', message: 'Web standards' })}
                        title={translate({ id: 'homepage.standards.heading', message: 'Real browsers, real devices, real users' })}>
                        <Translate id="homepage.standards.description">
                            WebdriverIO automates through WebDriver and WebDriver BiDi, the W3C standards every browser vendor ships. No patched browser builds and no JavaScript-emulated clicks: your tests interact with your app the way your users do.
                        </Translate>
                    </SectionHeader>
                    <div className={styles.grid3}>
                        <Feature to="/docs/automationProtocols" title={translate({ id: 'homepage.standards.bidi.title', message: 'WebDriver BiDi' })}>
                            <Translate id="homepage.standards.bidi.text">Network mocking, console logs and events in every browser, not just Chromium.</Translate>
                        </Feature>
                        <Feature to="/docs/autowait" title={translate({ id: 'homepage.standards.autowait.title', message: 'Auto-waiting' })}>
                            <Translate id="homepage.standards.autowait.text">Commands wait for elements to be interactable, so tests stay stable without sleeps.</Translate>
                        </Feature>
                        <Feature to="/docs/ecosystem" title={translate({ id: 'homepage.standards.ecosystem.title', message: '70+ plugins' })}>
                            <Translate id="homepage.standards.ecosystem.text">Services and reporters for clouds, frameworks and CI, from the team and the community.</Translate>
                        </Feature>
                    </div>
                </section>

                <section className={clsx(styles.frame, styles.section, styles.logos)}>
                    <LogoCarousel logos={logos} />
                </section>

                <section className={clsx(styles.frame, styles.section)}>
                    <Sponsors />
                </section>

                <section className={clsx(styles.frame, styles.cta)}>
                    <h2>
                        <Translate id="homepage.cta.heading">Start testing in under a minute</Translate>
                    </h2>
                    <InstallCommand />
                    <div className={styles.heroActions}>
                        <Link className={clsx('button button--primary button--lg', styles.primaryButton)} to="/docs/gettingstarted">
                            <Translate id="homepage.getStarted">Get Started</Translate>
                        </Link>
                        <Link className={clsx('button button--lg', styles.secondaryButton)} to="https://discord.webdriver.io">
                            <Translate id="homepage.cta.discord">Join the Discord</Translate>
                        </Link>
                    </div>
                </section>
            </main>
        </Layout>
    )
}
