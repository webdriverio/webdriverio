import React from 'react'
import clsx from 'clsx'
import Layout from '@theme/Layout'
import CodeBlock from '@theme/CodeBlock'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'

import LogoCarousel from './components/LogoCarousel'
import Feature from './components/Feature'
import Section from './components/Section'
import Highlight from './components/Highlight'
import Robot from './components/Robot'

import styles from './styles.module.css'
import { logos, features, LHIntregrationExample, SetupExample, ReactIntegration } from '../constants'

function Home() {
    const context = useDocusaurusContext()
    const { siteConfig = {} } = context
    return (
        <Layout
            title={`${siteConfig.title} · ${siteConfig.tagline}`}
            description={`${siteConfig.tagline}`}>
            <header className={clsx('hero hero--primary', styles.heroBanner)}>
                <div className="container">
                    <h1 className="hero__title">
                        <Robot />
                    </h1>
                    <p className="hero__subtitle">{siteConfig.tagline}</p>
                    <div className={styles.social}>
                        <iframe src="https://www.facebook.com/plugins/like.php?href=https%3A%2F%2Fwebdriver.io&mp;width=118&mp;layout=button_count&mp;action=like&mp;size=small&mp;share=true&mp;height=46&mp;appId=585739831492556" width="118" height="46" style={{ border: 'none', overflow: 'hidden' }} scrolling="no" frameBorder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" id="fblike"></iframe>
                        <iframe src="https://ghbtns.com/github-btn.html?user=webdriverio&amp;repo=webdriverio&amp;type=watch&amp;count=true" height="20" width="118" frameBorder="0" scrolling="0" style={{ width: '118px', height: '20px' }}></iframe>
                        <a className={styles.tweetBtn} href="https://twitter.com/intent/tweet?hashtags=automation&amp;original_referer=https%3A%2F%2Fwebdriver.io%3A3000%2F&amp;ref_src=twsrc%5Etfw&amp;text=WebdriverIO%20-%20Next-gen%20browser%20and%20mobile%20automation%20test%20framework%20for%20Node.js&amp;tw_p=tweetbutton&amp;url=https%3A%2F%2Fwebdriver.io&amp;via=webdriverio" data-text="WebdriverIO - Next-gen browser and mobile automation test framework for Node.js" data-url="https://webdriver.io" data-via="webdriverio" data-hashtags="automation" data-show-count="false">Tweet</a>
                        <a className={styles.tweetBtn} href="https://twitter.com/intent/follow?original_referer=https%3A%2F%2Fwebdriver.io%3A3000%2F&amp;ref_src=twsrc%5Etfw&amp;screen_name=webdriverio&amp;tw_p=followbutton" data-show-count="false">Follow @webdriverio</a>
                    </div>
                    <div className={styles.buttons}>
                        <Link
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                            to={useBaseUrl('/docs/gettingstarted')}>
                        Get Started
                        </Link>
                        <Link
                            to="/community/resources#conferencemeetup-talks"
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                        >Watch Talks</Link>
                        <Link
                            to="https://leanpub.com/webapp-testing-guidebook"
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                        >Read the Book</Link>
                        <Link
                            to="https://learn.webdriver.io"
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                        >Take The Course</Link>
                        <Link
                            to="https://gitter.im/webdriverio/webdriverio"
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                        >Support</Link>
                    </div>
                </div>
            </header>
            <main>
                {features && features.length > 0 && (
                    <Section isDark>
                        {features.map((props, idx) => (
                            <Feature key={idx} {...props} />
                        ))}
                    </Section>
                )}
                <Section>
                    <LogoCarousel logos={logos}></LogoCarousel>
                </Section>
                <Highlight
                    img={
                        <CodeBlock className="js" children={ReactIntegration}></CodeBlock>
                    }
                    isDark
                    title="Support for Modern Web and Mobile Frameworks"
                    text={
                        <>
                            <p>
                                WebdriverIO allows you to automate any application written
                                with modern web frameworks such as <a href="https://reactjs.org/">React</a>, <a href="https://angular.io/">Angular</a>, <a href="https://www.polymer-project.org/">Polymer</a>
                                or <a href="https://vuejs.org/">Vue.js</a> as well as native mobile applications for Android
                                and iOS.
                            </p>
                            <p>
                                It comes with smart selector strategies that can, e.g. using
                                the <Link to={useBaseUrl('/docs/api/browser/react$')}><code>react$</code></Link> command, fetch React components by its component
                                name and filter it by its props or states. A similar command
                                called <Link to={useBaseUrl('/docs/api/element/shadow$')}><code>$shadow</code></Link> provides the ability to fetch elements within
                                the <a href="https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM">shadow DOM</a> of a web component.
                            </p>
                            <div>
                                <h4>Native Support for:</h4>
                                <a href="https://reactjs.org/" className={styles.frameworkLogos}><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0xMS41IC0xMC4yMzE3NCAyMyAyMC40NjM0OCI+CiAgPHRpdGxlPlJlYWN0IExvZ288L3RpdGxlPgogIDxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSIyLjA1IiBmaWxsPSIjNjFkYWZiIi8+CiAgPGcgc3Ryb2tlPSIjNjFkYWZiIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPgogICAgPGVsbGlwc2Ugcng9IjExIiByeT0iNC4yIi8+CiAgICA8ZWxsaXBzZSByeD0iMTEiIHJ5PSI0LjIiIHRyYW5zZm9ybT0icm90YXRlKDYwKSIvPgogICAgPGVsbGlwc2Ugcng9IjExIiByeT0iNC4yIiB0cmFuc2Zvcm09InJvdGF0ZSgxMjApIi8+CiAgPC9nPgo8L3N2Zz4K" alt="" /></a>
                                <a href="https://vuejs.org/" className={styles.frameworkLogos}><img src="/img/icons/vue.png" alt="Vue.js" /></a>
                                <a href="https://angular.io/" className={styles.frameworkLogos}><img src="/img/icons/angular.svg" alt="Angular" /></a>
                                <a href="https://www.polymer-project.org/" className={styles.frameworkLogos}><img src="/img/icons/polymer.svg" alt="Polymer" /></a>
                                <a href="https://svelte.dev/" className={styles.frameworkLogos}><img src="/img/icons/svelte.png" alt="Svelte" /></a>
                            </div>
                        </>
                    }
                />
                <Highlight
                    img={
                        <CodeBlock className="js" children={LHIntregrationExample}></CodeBlock>
                    }
                    reversed
                    title="Google Lighthouse Integration"
                    text={
                        <>
                            <p>
                                WebdriverIO not only runs automation based on the WebDriver protocol, it also leverages
                                native browser APIs to enable integrations to popular developer tools such as <a href="https://chromedevtools.github.io/devtools-protocol/">Chrome DevTools</a> or
                                <a href="https://developers.google.com/web/tools/lighthouse">Google Lighthouse</a>. With the <Link to={useBaseUrl('/docs/devtools-service')}><code>@wdio/devtools-service</code></Link> plugin you have access to
                                commands for validating if you app is a valid PWA application as well as to commands for
                                capturing frontend performance metrics such as <code>speedIndex</code> and others.
                            </p>
                            <div>
                                <h4>Integration to developer tools such as:</h4>
                                <a href="https://chromedevtools.github.io/devtools-protocol" className={styles.frameworkLogos}><img src="/img/icons/devtools.png" alt="Chrome DevTools" /></a>
                                <a href="https://developers.google.com/web/tools/lighthouse" className={styles.frameworkLogos}><img src="/img/icons/lighthouse-logo.svg" alt="Google Lighthouse" /></a>
                                <a href="https://www.deque.com/axe/" className={styles.frameworkLogos}><img src="/img/icons/axe.png" alt="Axe Accessibility Engine" /></a>
                            </div>
                        </>
                    }
                />
                <Highlight
                    img={
                        <iframe
                            width="560"
                            height="315"
                            src="https://www.youtube.com/embed/CHcjEI3YZ7Y"
                            frameBorder="0"
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    }
                    isDark
                    title="Watch Talks about WebdriverIO"
                    text={
                        <>
                            <p>
                                The community around WebdriverIO is actively speaking on various user groups or
                                conferences about specific topics around automated testing with WebdriverIO. Check out
                                this talk on <a href="https://www.youtube.com/watch?v=CHcjEI3YZ7Y">My favourite features of WebdriverIO</a> by <a href="https://twitter.com/ailuj876">Julia Pottinger</a> at <a href="https://openqualityconf.com/">Open Quality Conference</a>.
                            </p>
                            <p>
                                There is also many YouTube Channels with useful tutorials by community members
                                such as <a href="https://www.youtube.com/user/medigerati/videos?flow=grid&sort=p&view=0">Klamping</a>, <a href="https://www.youtube.com/channel/UCqaDA1xslraCbam2CxuKhUw">Seventeenth Sep</a> or <a href="https://www.youtube.com/watch?v=e8goAKb6CC0&list=PL6AdzyjjD5HBbt9amjf3wIVMaobb28ZYN">Automation Bro</a>.
                            </p>
                        </>
                    }
                />
                <Highlight
                    img={
                        <CodeBlock className="bash" children={SetupExample}></CodeBlock>
                    }
                    reversed
                    title="Get Started With WebdriverIO within Minutes"
                    text={
                        <>
                            <p>
                                The WebdriverIO testrunner comes with a command line interface that
                                provides a nice configuration utility that helps you to create your
                                config file in less than a minute. It also gives an overview of all
                                available 3rd party packages like framework adaptions, reporter and
                                services and installs them for you!
                            </p>
                        </>
                    }
                />
            </main>
        </Layout>
    )
}

export default Home
