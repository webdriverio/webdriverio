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
                    <h1 className="hero__title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="350" viewBox="0 0 585.1 841.9" class="undefined"><switch class="undefined"><foreignObject requiredExtensions="http://ns.adobe.com/AdobeIllustrator/10.0/" width="1" height="1" class="undefined"/><g class="undefined"><g class="undefined"><rect x="194.2" y="328.8" width="8.3" height="8.3" class="a"/><rect x="208.2" y="328.8" width="8.3" height="8.3" class="a"/><rect x="222.2" y="328.8" width="8.3" height="8.3" class="a"/><rect x="236.2" y="328.8" width="8.3" height="8.3" class="a"/><path d="M192.4 261v-51.7c-14.3 0-25.8 11.6-25.8 25.8C166.6 249.4 178.1 261 192.4 261z" class="a"/><path d="M418.1 235.2c0-14.3-11.6-25.8-25.8-25.8V261C406.5 261 418.1 249.4 418.1 235.2z" class="a"/><path d="M254 259.7c14.6 0 26.4-11.9 26.4-26.4s-11.9-26.4-26.4-26.4c-14.6 0-26.4 11.9-26.4 26.4S239.4 259.7 254 259.7zM254 211.8c11.8 0 21.4 9.6 21.4 21.4s-9.6 21.4-21.4 21.4c-11.8 0-21.4-9.6-21.4-21.4S242.2 211.8 254 211.8z" class="a"/><circle cx="254" cy="233.3" r="17.9" class="a"/><path d="M330.6 259.7c14.6 0 26.4-11.9 26.4-26.4s-11.9-26.4-26.4-26.4c-14.6 0-26.4 11.9-26.4 26.4S316.1 259.7 330.6 259.7zM330.6 211.8c11.8 0 21.4 9.6 21.4 21.4s-9.6 21.4-21.4 21.4c-11.8 0-21.4-9.6-21.4-21.4S318.8 211.8 330.6 211.8z" class="a"/><circle cx="330.6" cy="233.3" r="17.9" class="a"/><rect x="366.5" y="222.3" width="8.3" height="8.3" class="a"/><rect x="366.5" y="234.3" width="8.3" height="8.3" class="a"/><path d="M219.1 277.5h146.3c10.9 0 19.8-8.9 19.8-19.8v-64.8c0-10.9-8.9-19.8-19.8-19.8H219.1c-10.9 0-19.8 8.9-19.8 19.8v64.8C199.3 268.6 208.2 277.5 219.1 277.5zM204.3 192.8c0-8.2 6.7-14.8 14.8-14.8h146.3c8.2 0 14.8 6.7 14.8 14.8v64.8c0 8.2-6.7 14.8-14.8 14.8H219.1c-8.2 0-14.8-6.7-14.8-14.8V192.8z" class="a"/><path d="M323 503h54c2.5 0 4.5-2 4.5-4.5s-2-4.5-4.5-4.5h-54c-2.5 0-4.5 2-4.5 4.5S320.5 503 323 503z" class="a"/><path d="M323 516.5h18c2.5 0 4.5-2 4.5-4.5s-2-4.5-4.5-4.5h-18c-2.5 0-4.5 2-4.5 4.5S320.5 516.5 323 516.5z" class="a"/><path d="M323 489.5h54c2.5 0 4.5-2 4.5-4.5s-2-4.5-4.5-4.5h-54c-2.5 0-4.5 2-4.5 4.5S320.5 489.5 323 489.5z" class="a"/><path d="M241.6 429.5c12.1 0 20.8-9.8 20.8-21.9v-0.1c0-12.1-8.8-22.1-20.9-22.1 -12.1 0-20.8 9.8-20.8 21.9v0.1C220.7 419.5 229.5 429.5 241.6 429.5z" class="a"/><path d="M485.1 502.2c3.3-3.1 5.2-6.9 5.2-10.9 0-5.2-3.2-10-8.5-13.5V372.7c0-48.4-44.7-63.4-58-65.5v-2c0-10.9-8.9-19.8-19.8-19.8H180.7c-10.9 0-19.8 8.9-19.8 19.8v2c-13.3 2.2-58 17.2-58 65.5V477.9c-5.3 3.5-8.5 8.2-8.5 13.5 0 4 1.9 7.8 5.2 10.9 0.4 7.7-1.9 23-2.9 28.8l0 0.4c0 0.3 0 7.7 4.8 12.7 2.8 2.8 6.5 4.2 11 4.2 14.3 0 14.9-12 15.2-17.8 0-0.7 0.1-1.4 0.1-2 0.2-2.4 1.1-3.6 2.5-3.6 0 0 0.1 0 0.1 0 1.5 0 2.5 0.5 4.1 2.9 4.5 6.7 12.7 6 17 3.4 2.5-1.5 4.1-3.6 4.7-6.2 0.8-3.7-0.5-8.2-4-13.2 -2.7-3.9-3.3-7.2-3.1-9.7 3.3-3.1 5.2-6.9 5.2-10.9 0-5.3-3.3-10-8.5-13.5v-94.8c0-7.9 2.4-10.9 7.4-15.4 2.2-2 4.8-3 7.6-3.5v151.3c0 10.9 8.9 19.8 19.8 19.8h13.7v55.6h-11.4l-0.2 0c-0.2 0-19.6 3.9-21.9 24.7v21.3h69.1l21.3-7.4v-16.2c0.5-8.3-1-14.5-4.3-17.9V535.3h90.7v60.2c-3.4 3.4-4.9 9.6-4.3 17.9v16.2l21.3 7.4h69.1v-21.3c-2.3-20.8-21.7-24.7-21.9-24.7l-0.2 0h-11.4V535.3h14.1c10.9 0 19.8-8.9 19.8-19.8V364.2c2.8 0.5 5.4 1.6 7.6 3.5 5 4.5 7.4 7.5 7.4 15.4v94.8c-5.3 3.5-8.5 8.2-8.5 13.5 0 4 1.9 7.8 5.2 10.9 0.2 2.5-0.4 5.8-3.1 9.7 -3.5 5-4.8 9.4-4 13.2 0.6 2.6 2.2 4.8 4.6 6.2 4.4 2.6 12.5 3.2 17-3.4 1.6-2.5 2.6-2.9 4.1-2.9 0 0 0.1 0 0.1 0 1.4 0 2.3 1.2 2.5 3.6 0.1 0.6 0.1 1.2 0.1 2 0.3 5.8 0.9 17.8 15.2 17.8 4.5 0 8.2-1.4 11-4.2 4.9-4.9 4.8-12.3 4.8-12.7l0-0.4C487 525.3 484.8 509.9 485.1 502.2zM112.4 543.3c-3.2 0-5.6-0.9-7.4-2.7 -3.1-3.1-3.4-8-3.4-8.9 0.3-2.1 2.6-16 2.9-25.8 3.2 1.8 6.9 3.2 11.1 4 -1.3 9.2-1.6 10.3-2.7 14.1 -0.3 0.9-0.6 2-1 3.4 -1.1 3.9-0.7 7.1 1.2 9.6 1.8 2.4 4.5 3.4 6.7 3.9C118.2 542.4 116 543.3 112.4 543.3zM141.5 524.1c-0.3 0.9-1.1 1.7-1.8 2.2 -0.4-0.3-0.7-0.7-1-1.2 -1.8-2.7-4.1-5.2-8.5-5.2 -4.1 0.1-6.9 3.1-7.4 8.2 -0.1 0.6-0.1 1.4-0.1 2.2 -0.1 2.1-0.3 4.1-0.7 5.8 -1.4-0.2-3.8-0.7-4.9-2.2 -0.9-1.2-1-2.9-0.3-5.2 0.4-1.3 0.7-2.4 1-3.3 1.2-4 1.6-5.2 2.9-14.9 1.2 0.1 2.5 0.2 3.7 0.2 2.6 0 5.2-0.2 7.6-0.6 1.4 2.2 3.1 4.1 4.8 5.9 1.8 2 3.6 3.9 4.6 5.9C141.7 522.7 141.8 523.4 141.5 524.1zM148.1 514.8c2.6 3.8 3.7 7 3.3 9.3 -0.3 1.2-1 2.3-2.3 3 -0.8 0.5-3 1.3-5.4 1.1 0.7-0.8 1.3-1.7 1.7-2.7 0.6-1.7 0.5-3.5-0.4-5.3 -1.3-2.6-3.3-4.7-5.2-6.8 -1.2-1.3-2.5-2.7-3.5-4.2 3-0.8 5.7-2 8.1-3.3C144.7 508.5 145.8 511.5 148.1 514.8zM160.8 344.4c-5.8 1.7-11.5 4.4-16.3 8.6 -7.8 7-11.8 18.4-11.8 30.1V471.5h-23v-98.8c0-19.7 8.2-35.4 24.3-46.8 10.4-7.4 21.4-10.7 26.7-11.7V344.4zM225.8 615.6h-60.1c0.1-1 0.3-2 0.5-2.9h59.6C225.8 613.7 225.8 614.7 225.8 615.6zM226.4 609.7h-59.2c4.2-10.7 14.6-13.5 16.1-13.8h50.6c-0.6 0.6-1.2 1.2-1.8 1.9C229.7 600.7 227.5 605.1 226.4 609.7zM197.3 590.9V535.3h6.3v55.6H197.3zM219.8 493.5c-2.5 0-4.5 2-4.5 4.5v18.5c-8.2-2-14.3-9.4-14.3-18.2 0-10.3 8.4-18.8 18.8-18.8 10.3 0 18.8 8.4 18.8 18.8 0 8.8-6.1 16.2-14.3 18.2v-18.5C224.3 495.5 222.2 493.5 219.8 493.5zM230.8 615.3c-0.1-5.4 2.5-11 5.1-14.3 1.8-2.2 3.4-3.1 4.3-3.1 1.1-0.1 2.1 0.3 2.9 1.1 1.9 1.9 3 5.8 3 11L230.8 615.3zM234.9 568V535.3h6.8v55.6h-6.8v-12.3h2.3v-10.5H234.9zM265.5 502.6c0.9 0.9 2 1.3 3.2 1.3 1.2 0 2.3-0.4 3.2-1.3l13.8-13.8c1.7 2.8 2.7 6.1 2.7 9.6 0 10.3-8.4 18.8-18.8 18.8 -10.3 0-18.8-8.4-18.8-18.8s8.4-18.8 18.8-18.8c3.6 0 6.9 1 9.8 2.8l-13.8 13.8C263.7 497.9 263.7 500.8 265.5 502.6zM338 609.9c0-5.2 1.1-9.1 3-11 0.8-0.8 1.8-1.2 2.9-1.1 0.9 0.1 2.5 0.9 4.3 3.1 2.7 3.3 5.3 8.9 5.1 14.3L338 609.9zM349.3 578.5v12.3h-6.8V535.3h6.8v32.8h-2.3v10.5H349.3zM418.4 615.6h-60.1c0-1 0-1.9-0.1-2.9h59.6C418.1 613.6 418.3 614.6 418.4 615.6zM400.8 595.9c1.6 0.4 11.9 3.1 16.1 13.8h-59.2c-1-4.6-3.3-9-5.7-11.9 -0.6-0.7-1.2-1.4-1.8-1.9H400.8zM380.6 590.9V535.3h6.3v55.6H380.6zM396.6 501.9c0 10.9-8.9 19.8-19.8 19.8H273.5c11.2-1.9 19.7-11.7 19.7-23.4 0-13.1-10.7-23.8-23.8-23.8 -13.1 0-23.8 10.7-23.8 23.8 0 11.7 8.5 21.5 19.7 23.4h-41.8c11.2-1.9 19.8-11.7 19.8-23.4 0-13.1-10.7-23.8-23.8-23.8 -13.1 0-23.8 10.7-23.8 23.8 0 11.8 8.6 21.5 19.8 23.4H207.9c-10.9 0-19.8-8.9-19.8-19.8v-29.6h208.5V501.9zM189.2 431.9v-49h3.6v49H189.2zM197.6 435.9h-3.4l23.1-55h3.4L197.6 435.9zM241.6 382.1c14.8 0 24.6 11.8 24.6 25.2 0.1 0.1 0.1 0.1 0 0.1 0 13.4-9.9 25.3-24.7 25.3 -14.8 0-24.6-11.8-24.6-25.2v-0.1C216.9 394.1 226.8 382.1 241.6 382.1zM396.6 436.5H289.9c1.4-2.9 3.3-6.6 5.8-10.2 4.4-6.4 11.4-13.9 20-13.5 11 0.5 17.8 5.9 23.7 10.6 4.5 3.5 8.7 6.9 13.7 6.9 7 0 12.2-5.8 16.8-10.9 3.6-4.1 7.4-7.8 10.8-8.3 4.2-0.5 9.3 0.4 15.9 7.9V436.5zM396.6 406.6c-4.7-3.5-8.8-4.7-14.8-4.5 -7.4 0.2-13.8 6-18.5 11.3 -3.5 3.9-7 7.9-10.1 7.9 -1.9 0-4.9-2.4-8.1-4.9 -6.3-5-15-11.9-28.9-12.6 -13.1-0.6-22.8 9.6-29 19.1V378.5h109.4V406.6zM396.6 342.3h-208.5v-24.7c0-10.9 8.9-19.8 19.8-19.8h168.8c10.9 0 19.8 8.9 19.8 19.8V342.3zM423.8 344.4v-30.2c5.3 1 16.3 4.3 26.7 11.7 16.1 11.4 24.3 27.1 24.3 46.8V471.5h-23v-88.4c0-11.6-4-23.1-11.8-30.1C435.3 348.8 429.6 346.1 423.8 344.4zM435.6 527c-1.3-0.7-2-1.8-2.3-3 -0.5-2.3 0.6-5.5 3.3-9.3 2.3-3.3 3.4-6.3 3.8-9 2.4 1.4 5.1 2.5 8.1 3.3 -1.1 1.5-2.3 2.8-3.5 4.2 -1.9 2.1-3.9 4.3-5.2 6.8 -0.9 1.7-1 3.6-0.4 5.3 0.4 1.1 1 2 1.7 2.7C438.6 528.3 436.4 527.5 435.6 527zM462 530.3c0-0.8-0.1-1.6-0.1-2.2 -0.5-5-3.2-8.1-7.4-8.2 -4.4 0-6.7 2.5-8.5 5.2 -0.3 0.5-0.7 0.8-1 1.2 -0.7-0.6-1.5-1.3-1.8-2.2 -0.2-0.7-0.2-1.4 0.2-2.2 1-2.1 2.8-3.9 4.6-5.9 1.7-1.8 3.4-3.7 4.8-5.9 2.4 0.4 5 0.6 7.6 0.6 1.3 0 2.5-0.1 3.7-0.2 1.4 9.6 1.7 10.8 2.9 14.9 0.3 0.9 0.6 2 1 3.3 0.6 2.3 0.5 4-0.3 5.2 -1.1 1.5-3.5 2.1-4.9 2.2C462.2 534.3 462.1 532.4 462 530.3zM479.6 540.6c-1.8 1.8-4.2 2.7-7.4 2.7 -3.5 0-5.8-0.9-7.3-2.5 2.1-0.5 4.9-1.5 6.7-3.9 1.9-2.5 2.3-5.7 1.2-9.6 -0.4-1.4-0.7-2.4-1-3.4 -1.1-3.8-1.4-4.9-2.7-14.1 4.1-0.8 7.9-2.2 11.1-4 0.3 9.8 2.6 23.8 2.9 25.8C483 532.7 482.7 537.5 479.6 540.6z" class="a"/></g></g></switch></svg>
                    </h1>
                    <p className="hero__subtitle">{siteConfig.tagline}</p>
                    <div className="social">
                        <iframe src="https://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fwebdriver.io&width=118&layout=Link_count&action=like&size=small&show_faces=true&share=true&height=46&appId=585739831492556" width="140" height="46" style={{ border: 'none', overflow: 'hidden' }} scrolling="no" frameBorder="0" allow="encrypted-media" id="fblike"></iframe>
                        <iframe src="https://ghbtns.com/github-btn.html?user=webdriverio&amp;repo=webdriverio&amp;type=watch&amp;count=true" height="20" width="118" frameBorder="0" scrolling="0" style={{ width: '118px', height: '20px' }}></iframe>
                        <a href="https://twitter.com/share" className="twitter-share-button" data-via="bromann" data-hashtags="webdriverio">Tweet</a>
                        <a href="https://twitter.com/webdriverio" className="twitter-follow-button" data-show-count="true" data-lang="en">Follow @webdriverio</a>
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
                            to="#watch"
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
