import React, { useRef, useEffect } from 'react'
import clsx from 'clsx'
import Layout from '@theme/Layout'
import CodeBlock from '@theme/CodeBlock'
import Link from '@docusaurus/Link'
import Translate, { translate } from '@docusaurus/Translate'
import useBaseUrl from '@docusaurus/useBaseUrl'

import LogoCarousel from '../components/LogoCarousel.tsx'
import Features from '../components/Features.tsx'
import Section from '../components/Section.tsx'
import ImageSwitcher from '../components/ImageSwitcher.tsx'
import Highlight from '../components/Highlight.tsx'
import Robot from '../components/Robot.tsx'
import { CreateProjectAnimation } from '../components/CreateProjectAnimation.tsx'

import styles from './styles.module.css'
import { logos, features, LHIntregrationExample, SetupExample, ComponentTestingExample } from '../constants.tsx'

const tagline = translate({
    id: 'homepage.tagline',
    message: 'Next-gen browser and mobile automation test framework for Node.js'
})
function Home() {
    const ref = useRef(null)

    useEffect(() => {
        // eslint-disable-next-line no-undef
        if (!window.Ribbons) {
            return
        }

        // eslint-disable-next-line no-undef
        new window.Ribbons({
            colorSaturation: '60%',
            colorBrightness: '50%',
            colorAlpha: 0.2,
            colorCycleSpeed: 5,
            verticalPosition: 'random',
            horizontalSpeed: 100,
            ribbonCount: 3,
            strokeSize: 0,
            parallaxAmount: -0.2,
            animateSections: true,
            element: ref.current
        })
    })

    return (
        <Layout
            title={`WebdriverIO · ${tagline}`}
            description={tagline}>
            <header className={clsx('hero hero--primary', styles.heroBanner)} ref={ref}>
                <div className="container">
                    <h1 className="hero__title">
                        <Robot />
                    </h1>
                    <p className="hero__subtitle">
                        {tagline}
                    </p>
                    <div className={styles.buttons}>
                        <Link
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                            to={useBaseUrl('/docs/gettingstarted')}
                        >
                            <Translate>Get Started</Translate>
                        </Link>
                        <Link
                            to="/docs/why-webdriverio"
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                        >
                            <Translate>Why WebdriverIO?</Translate>
                        </Link>
                        <Link
                            to="https://github.com/webdriverio"
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                        >
                            <Translate>View on GitHub</Translate>
                        </Link>
                        <Link
                            to="https://youtube.com/@webdriverio"
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                        >
                            <Translate>Watch on YouTube</Translate>
                        </Link>
                    </div>
                    <section className="sponsorSection">
                        <div>
                            <em>Sponsored by</em>
                            <ImageSwitcher
                                lightImageSrc="/img/sponsors/browserstack_black.svg"
                                darkImageSrc="/img/sponsors/browserstack_white.svg"
                                alt="BrowserStack"
                                link="https://www.browserstack.com/automation-webdriverio"
                            />
                            <em style={{ marginRight: 0 }}>&nbsp; and &nbsp;</em>
                            <ImageSwitcher
                                lightImageSrc="/img/sponsors/saucelabs_black.svg"
                                darkImageSrc="/img/sponsors/saucelabs_white.svg"
                                alt="Sauce Labs"
                                link="https://www.saucelabs.com"
                            />
                        </div>
                    </section>
                    <Features features={features} />
                </div>
            </header>
            <main>
                <Highlight
                    img={<CodeBlock language="js" children={ComponentTestingExample}></CodeBlock>}
                    isDark
                    title={translate({
                        id: 'homepage.componentTesting.heading',
                        message: 'E2E and Unit / Component Testing in real Browser!'
                    })}
                    text={<>
                        <p>
                            <Translate
                                id="homepage.componentTesting.para1"
                                values={{
                                    allInOne: (<b><Translate>all in one</Translate></b>),
                                    usedBy: (<b><Translate>used by your users</Translate></b>)
                                }}>
                                {'WebdriverIO is an {allInOne} framework for your web app development. It enables you to run ' +
                                    'small and lightweight component tests as well as running e2e test scenarios in the browser or on ' +
                                    'a mobile device. This guarantees that you to do the testing in an environment {usedBy}.'}
                            </Translate>
                        </p>
                        <p>
                            <Translate
                                id="homepage.componentTesting.para2"
                                values={{ reactComponents: (<b>React components</b>) }}>
                                {'It comes with smart selector strategies that simplify interacting e.g. with {reactComponents} or ' +
                                    'running deep selector queries with nested shadow DOM trees. As interactions happen through a standardized ' +
                                    'automation protocol it is guaranteed they behave natively and aren\'t just JavaScript emulated.'}
                            </Translate>
                        </p>
                        <div>
                            <h4><Translate>Easy setup for web component testing with:</Translate></h4>
                            <a href="/docs/component-testing/react" className={styles.frameworkLogos}><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0xMS41IC0xMC4yMzE3NCAyMyAyMC40NjM0OCI+CiAgPHRpdGxlPlJlYWN0IExvZ288L3RpdGxlPgogIDxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSIyLjA1IiBmaWxsPSIjNjFkYWZiIi8+CiAgPGcgc3Ryb2tlPSIjNjFkYWZiIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPgogICAgPGVsbGlwc2Ugcng9IjExIiByeT0iNC4yIi8+CiAgICA8ZWxsaXBzZSByeD0iMTEiIHJ5PSI0LjIiIHRyYW5zZm9ybT0icm90YXRlKDYwKSIvPgogICAgPGVsbGlwc2Ugcng9IjExIiByeT0iNC4yIiB0cmFuc2Zvcm09InJvdGF0ZSgxMjApIi8+CiAgPC9nPgo8L3N2Zz4K" alt="" /></a>
                            <a href="/docs/component-testing/vue" className={styles.frameworkLogos}><img src="/img/icons/vue.png" alt="Vue.js" /></a>
                            <a href="/docs/component-testing/vue#testing-vue-components-in-nuxt" className={styles.frameworkLogos}><img src="/img/icons/nuxt.svg" alt="Nuxt" /></a>
                            <a href="/docs/component-testing/svelte" className={styles.frameworkLogos}><img src="/img/icons/svelte.png" alt="Svelte" /></a>
                            <a href="/docs/component-testing/preact" className={styles.frameworkLogos}><img src="/img/icons/preact.png" alt="Preact" /></a>
                            <a href="/docs/component-testing/solid" className={styles.frameworkLogos}><img src="/img/icons/solidjs.svg" alt="SolidJS" /></a>
                            <a href="/docs/component-testing/lit" className={styles.frameworkLogos}><img src="/img/icons/lit.svg" alt="Lit" /></a>
                            <a href="/docs/component-testing/stencil" className={styles.frameworkLogos}><img src="/img/icons/stencil.svg" alt="Stencil" /></a>
                        </div>
                    </>} reversed={undefined} />
                <Highlight
                    img={<CreateProjectAnimation />}
                    reversed
                    title={translate({
                        id: 'homepage.hightlight.createProject',
                        message: 'Get Started With WebdriverIO within Seconds'
                    })}
                    text={<>
                        <p>
                            <Translate>
                                The WebdriverIO testrunner comes with a command line interface that
                                provides a powerful configuration utility and helps you to create your
                                test setup in less than a minute. It lets you pick from available
                                test framework integrations and easily allows to add all supported
                                reporter and service plugins!
                            </Translate>
                            <br />
                            <br />
                            <Translate>
                                With just one simple command you can set up a complete test suite:
                            </Translate>
                        </p>
                        <div>
                            <CodeBlock className="bash" children={SetupExample}></CodeBlock>
                        </div>
                        <p>
                            <Translate
                                id="homepage.highlight.getStartedOnYouTube"
                                values={{
                                    youtubeLink: (
                                        <Link to="https://www.youtube.com/watch?v=GAc031zGWTM&list=PLPO0LFyCaSo3oedws079pCNtppXAZdjv6">
                                            <Translate
                                                id="homepage.highlight.getStartedOnYouTube.label;"
                                                description="The label for the link to my YouTube">
                                                on YouTube
                                            </Translate>
                                        </Link>
                                    )
                                }}>
                                {'Start learning more about WebdriverIO and how to get started {youtubeLink}.'}
                            </Translate>
                        </p>
                    </>} isDark={undefined} />
                <Highlight
                    img={<iframe
                        width="560"
                        height="315"
                        src="https://www.youtube.com/embed/CHcjEI3YZ7Y"
                        frameBorder="0"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen />}
                    isDark
                    title={translate({
                        id: 'homepage.hightlight.watch',
                        message: 'Watch Talks about WebdriverIO'
                    })}
                    text={<>
                        <p>
                            <Translate
                                id="homepage.highlight.conferenceTalk"
                                values={{
                                    youtubeLink: (
                                        <Link to="https://www.youtube.com/watch?v=CHcjEI3YZ7Y">
                                            <Translate
                                                id="homepage.highlight.conferenceTalk.label"
                                                description="The conference talk title">
                                                My favourite features of WebdriverIO
                                            </Translate>
                                        </Link>
                                    ),
                                    videoAuthor: (
                                        <Link to="https://twitter.com/ailuj876">
                                            Julia Pottinger
                                        </Link>
                                    ),
                                    conferenceLink: (
                                        <Link to="https://openqualityconf.com/">
                                            Open Quality Conference
                                        </Link>
                                    )
                                }}>
                                {'The community around WebdriverIO is actively speaking on various user groups or ' +
                                    'conferences about specific topics around automated testing with WebdriverIO. Check out ' +
                                    'this talk on {youtubeLink} by {videoAuthor} at {conferenceLink}.'}
                            </Translate>
                        </p>
                        <p>
                            <Translate
                                id="homepage.highlight.youtubeChannels"
                                values={{
                                    channelOne: (
                                        <Link to="https://www.youtube.com/user/medigerati/videos?flow=grid&sort=p&view=0">
                                            Klamping
                                        </Link>
                                    ),
                                    channelTwo: (
                                        <Link to="https://www.youtube.com/channel/UCqaDA1xslraCbam2CxuKhUw">
                                            Seventeenth Sep
                                        </Link>
                                    ),
                                    channelThree: (
                                        <Link to="https://www.youtube.com/watch?v=e8goAKb6CC0&list=PL6AdzyjjD5HBbt9amjf3wIVMaobb28ZYN">
                                            Automation Bro
                                        </Link>
                                    )
                                }}>
                                {'There is also many YouTube Channels with useful tutorials by community members ' +
                                    'such as {channelOne}, {channelTwo} or {channelThree}.'}
                            </Translate>
                        </p>
                    </>} reversed={undefined} />
                <Highlight
                    img={<CodeBlock language="js" children={LHIntregrationExample}></CodeBlock>}
                    reversed
                    title={translate({
                        id: 'homepage.hightlight.lighthouse',
                        message: 'Google Lighthouse Integration'
                    })}
                    text={<>
                        <p>
                            <Translate
                                id="homepage.highlight.devtools"
                                values={{
                                    devtoolsLink: (
                                        <Link to="https://chromedevtools.github.io/devtools-protocol/">
                                            Chrome DevTools
                                        </Link>
                                    ),
                                    lighthouseLink: (
                                        <Link to="https://developers.google.com/web/tools/lighthouse">
                                            Google Lighthouse
                                        </Link>
                                    ),
                                    devtoolsServiceLink: (
                                        <Link to={useBaseUrl('/docs/lighthouse-service')}>
                                            <code>@wdio/lighthouse-service</code>
                                        </Link>
                                    )
                                }}>
                                {'WebdriverIO not only runs automation based on the WebDriver protocol, it also leverages ' +
                                    'native browser APIs to enable integrations to popular developer tools such as ' +
                                    '{devtoolsLink} or {lighthouseLink}. With the {devtoolsServiceLink} plugin you have access to ' +
                                    'commands for validating if you app is a valid PWA application as well as to commands for ' +
                                    'capturing frontend performance metrics such as `speedIndex` and others.'}
                            </Translate>
                        </p>
                        <div>
                            <h4><Translate>Integration to developer tools such as:</Translate></h4>
                            <a href="https://chromedevtools.github.io/devtools-protocol" className={styles.frameworkLogos}><img src="/img/icons/devtools.png" alt="Chrome DevTools" /></a>
                            <a href="https://developers.google.com/web/tools/lighthouse" className={styles.frameworkLogos}><img src="/img/icons/lighthouse-logo.svg" alt="Google Lighthouse" /></a>
                            <a href="https://www.deque.com/axe/" className={styles.frameworkLogos}><img src="/img/icons/axe.png" alt="Axe Accessibility Engine" /></a>
                        </div>
                    </>} isDark={undefined} />
                <Section isDark>
                    <LogoCarousel logos={logos}></LogoCarousel>
                </Section>
            </main>
        </Layout>
    )
}

export default Home
