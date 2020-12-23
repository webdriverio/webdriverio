import React from 'react'
import clsx from 'clsx'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './styles.module.css'

const features = [{
    title: 'Extendable',
    imageUrl: 'img/teaser/extendable.png',
    description: (
        <>
            Adding helper functions, or more complicated sets and combinations
            of existing commands is <strong>simple</strong> and really <strong>useful</strong>
        </>
    ),
}, {
    title: 'Compatible',
    imageUrl: 'img/teaser/compatible.png',
    description: (
        <>
            WebdriverIO can be run on the <a href="https://w3c.github.io/webdriver/"><strong>WebDriver Protocol</strong></a> for
            true cross browser testing as well as <a href="https://chromedevtools.github.io/devtools-protocol/"><strong>Chrome DevTools Protocol</strong></a> for
            Chromium based automation using <a href="https://pptr.dev/">Puppeteer</a>.
        </>
    ),
},
{
    title: 'Feature Rich',
    imageUrl: 'img/teaser/featurerich.png',
    description: (
        <>
            The huge variety of community plugins allows you to easily integrate
            and extend your setup to fulfill your requirements.
        </>
    ),
}]

function Feature({ imageUrl, title, description }) {
    const imgUrl = useBaseUrl(imageUrl)
    return (
        <div className={clsx('col col--4', styles.feature)}>
            {imgUrl && (
                <div className="text--center">
                    <img className={styles.featureImage} src={imgUrl} alt={title} />
                </div>
            )}
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    )
}

function Home() {
    const context = useDocusaurusContext()
    const { siteConfig = {} } = context
    return (
        <Layout
            title={`Hello from ${siteConfig.title}`}
            description="Description will go into a meta tag in <head />">
            <header className={clsx('hero hero--primary', styles.heroBanner)}>
                <div className="container">
                    <h1 className="hero__title">{siteConfig.title}</h1>
                    <p className="hero__subtitle">{siteConfig.tagline}</p>
                    <div className={styles.buttons}>
                        <Link
                            className={clsx(
                                'button button--outline button--secondary button--lg',
                                styles.getStarted,
                            )}
                            to={useBaseUrl('/docs/gettingstarted')}>
                        Get Started
                        </Link>
                    </div>
                </div>
            </header>
            <main>
                {features && features.length > 0 && (
                    <section className={styles.features}>
                        <div className="container">
                            <div className="row">
                                {features.map((props, idx) => (
                                    <Feature key={idx} {...props} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </Layout>
    )
}

export default Home
