/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')
const PropTypes = require('prop-types')

/* eslint-disable import/no-unresolved */
const CompLibrary = require('../../core/CompLibrary.js')
const translate = require('../../server/translate.js').translate
/* eslint-enable import/no-unresolved */

const MarkdownBlock = CompLibrary.MarkdownBlock /* Used to read markdown */
const Container = CompLibrary.Container
const GridBlock = CompLibrary.GridBlock

const siteConfig = require(process.cwd() + '/siteConfig.js')

function imgUrl(img) {
    return siteConfig.baseUrl + 'img/' + img
}

function docUrl(doc, language) {
    return siteConfig.baseUrl + 'docs/' + (language ? language + '/' : '') + doc
}

class Button extends React.Component {
    render() {
        return (
            <div className="pluginWrapper buttonWrapper">
                <a className="button" href={this.props.href} target={this.props.target}>
                    {this.props.children}
                </a>
            </div>
        )
    }
}

Button.defaultProps = {
    target: '_self',
}

Button.propTypes = {
    href: PropTypes.string,
    target: PropTypes.string,
    children: PropTypes.array
}

const SplashContainer = props => (
    <div className="homeContainer">
        <div className="homeSplashFade">
            <div className="wrapper homeWrapper">{props.children}</div>
        </div>
    </div>
)

SplashContainer.propTypes = {
    children: PropTypes.array
}

const Logo = props => (
    <div className="projectLogo">
        <img src={props.img_src} />
    </div>
)

Logo.propTypes = {
    img_src: PropTypes.string
}

const Badges = () => (
    <section>
        <div className="badges">
            <a href="https://badge.fury.io/js/webdriverio" data-bindattr-34="34"><img src="https://badge.fury.io/js/webdriverio.svg" data-bindattr-35="35" className="retina-badge" /></a>
            <a href="https://github.com/webdriverio/webdriverio/actions?query=workflow%3ATest"><img src="https://github.com/webdriverio/webdriverio/workflows/Test/badge.svg?branch=master" alt="Build Status" /></a>
            <a href="https://codecov.io/gh/webdriverio/webdriverio"><img alt="CodeCov" src="https://codecov.io/gh/webdriverio/webdriverio/branch/master/graph/badge.svg" /></a>
        </div>
        <div>
            <iframe src="https://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fwebdriver.io&width=118&layout=button_count&action=like&size=small&show_faces=true&share=true&height=46&appId=585739831492556" width="118" height="46" style={{ border: 'none', overflow: 'hidden' }} scrolling="no" frameBorder="0" allow="encrypted-media" id="fblike"></iframe>
            <iframe src="https://ghbtns.com/github-btn.html?user=webdriverio&amp;repo=webdriverio&amp;type=watch&amp;count=true" height="20" width="118" frameBorder="0" scrolling="0" style={{ width: '118px', height: '20px' }}></iframe>
            <a href="https://twitter.com/share" className="twitter-share-button" data-via="bromann" data-hashtags="webdriverio">Tweet</a>
            <a href="https://twitter.com/webdriverio" className="twitter-follow-button" data-show-count="true" data-lang="en">Follow @webdriverio</a>
        </div>
    </section>
)

const ProjectTitle = () => (
    <header>
        <h2 className="projectTitle">
            Webdriver <span>I/O</span>
        </h2>
        <small className="tagline">{siteConfig.tagline}</small>
        <Badges />
    </header>
)

const PromoSection = props => (
    <div className="section promoSection">
        <div className="promoRow">
            <div className="pluginRowBlock">{props.children}</div>
        </div>
    </div>
)

PromoSection.propTypes = {
    children: PropTypes.array
}

class HomeSplash extends React.Component {
    render() {
        let language = this.props.language || ''
        return (
            <SplashContainer>
                <Logo img_src={imgUrl('webdriverio.png')} />
                <div className="inner">
                    <ProjectTitle />
                    <PromoSection>
                        <Button href={docUrl('gettingstarted.html', language)}>Get Started</Button>
                        <Button href="#watch">Watch Talks</Button>
                        <Button href="https://leanpub.com/webapp-testing-guidebook">Read the Book</Button>
                        <Button href="https://gitter.im/webdriverio/webdriverio">Support</Button>
                    </PromoSection>
                </div>
            </SplashContainer>
        )
    }
}

HomeSplash.propTypes = {
    language: PropTypes.string
}

const Block = props => (
    <Container
        padding={['bottom', 'top']}
        id={props.id}
        background={props.background}>
        <GridBlock align="center" contents={props.children} layout={props.layout} />
    </Container>
)

Block.propTypes = {
    id: PropTypes.string,
    layout: PropTypes.string,
    background: PropTypes.string,
    children: PropTypes.array,
}

const TestSetup = () => (
    <Block background="light">
        {[
            {
                content: '' +
                    'The WebdriverIO testrunner comes with a command line interface that provides a nice configuration utility that ' +
                    'helps you to create your config file in less than a minute. It also gives an overview of all available 3rd party ' +
                    'packages like framework adaptions, reporter and services and installs them for you!' +
                    '<img class="install" src="/img/install.png" alt="Install WebdriverIO Command" />',
                image: imgUrl('config-utility.gif'),
                imageAlign: 'left',
                title: 'Get Started With WebdriverIO within Minutes',
            },
        ]}
    </Block>
)

const AutomationProtocolSupport = () => (
    <Block>
        {[
            {
                content: '' +
                    'WebdriverIO is always up to date with the latest automation frameworks and therefore, supports not only capabilities ' +
                    'of the <a href="https://w3c.github.io/webdriver/">WebDriver</a> but also commands of the <a href="https://chromedevtools.github.io/devtools-protocol/">Chrome DevTools</a> ' +
                    'protocol using tools like <a href="https://pptr.dev/">Puppeteer</a>. The framework allows you to freely switch between ' +
                    'running remote WebDriver commands as well stubbing and mocking features of Puppeteer. Have a look into the <a href="https://github.com/webdriverio/webdriverio/blob/master/examples/devtools/intercept.js">examples</a> ' +
                    'directory.',
                image: imgUrl('w3c-wdio-pptr.png'),
                imageAlign: 'right',
                title: '1st Class WebDriver and Puppeteer Support',
            },
        ]}
    </Block>
)

const ReactSupport = () => (
    <Block id="reactSupport">
        {[
            {
                content: '' +
                    'WebdriverIO allows you to automate any application written with modern web frameworks ' +
                    'such as [React](https://reactjs.org/), [Angular](https://angular.io/), [Polymer](https://www.polymer-project.org/) ' +
                    'or [Vue.js](https://vuejs.org/) as well as native mobile applications for Android and iOS.<br><br>' +
                    'It comes with smart selector strategies that can, e.g. using the [`react$`](/docs/api/element/react$.html) ' +
                    'command, fetch React components by its component name and filter it by its props or states. A similar command called ' +
                    '[`$shadow`](/docs/api/element/shadow$.html) provides the ability to fetch elements within the ' +
                    '[shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) of a web component.<br>' +
                    '<br>' +
                    '<p>Native Support for:<p>' +
                    '<a href="https://reactjs.org/"><img class="frameworkLogos" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0xMS41IC0xMC4yMzE3NCAyMyAyMC40NjM0OCI+CiAgPHRpdGxlPlJlYWN0IExvZ288L3RpdGxlPgogIDxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSIyLjA1IiBmaWxsPSIjNjFkYWZiIi8+CiAgPGcgc3Ryb2tlPSIjNjFkYWZiIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPgogICAgPGVsbGlwc2Ugcng9IjExIiByeT0iNC4yIi8+CiAgICA8ZWxsaXBzZSByeD0iMTEiIHJ5PSI0LjIiIHRyYW5zZm9ybT0icm90YXRlKDYwKSIvPgogICAgPGVsbGlwc2Ugcng9IjExIiByeT0iNC4yIiB0cmFuc2Zvcm09InJvdGF0ZSgxMjApIi8+CiAgPC9nPgo8L3N2Zz4K" alt=""></a>' +
                    '<a href="https://vuejs.org/"><img class="frameworkLogos" src="/img/icons/vue.png" alt="Vue.js"></a>' +
                    '<a href="https://angular.io/"><img class="frameworkLogos" src="/img/icons/angular.svg" alt="Angular"></a>' +
                    '<a href="https://www.polymer-project.org/"><img class="frameworkLogos" src="/img/icons/polymer.svg" alt="Polymer"></a>',
                image: imgUrl('react-support.png'),
                imageAlign: 'right',
                title: 'Support for Modern Web and Mobile Frameworks',
            },
        ]}
    </Block>
)

const Talks = () => (
    <Container background="light" padding={['bottom', 'top']}>
        <a className="anchor" name="watch" />
        <a className="hash-link" href="#watch" />
        <div className="blockElement imageAlignSide twoByGridBlock videoContainer">
            <div className="video">
                <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/jOmvPpzLMf8?start=3204"
                    frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
            <div className="blockContent">
                <h2>
                    <div>
                        <span>
                            <p>
                                <translate>Watch Talks about WebdriverIO</translate>
                            </p>
                        </span>
                    </div>
                </h2>
                <div>
                    <MarkdownBlock>
                        <translate>
                            The community around WebdriverIO is actively speaking on various user groups or
                            conferences about specific topics around automated testing with WebdriverIO. Check out
                            this talk on [The Nuts and Bolts of WebdriverIO](https://www.youtube.com/watch?v=jOmvPpzLMf8&feature=youtu.be&t=3204)
                            by [@bromann](https://twitter.com/bromann) at [Selenium Camp 2020](https://seleniumcamp.com/). There is also a whole
                            [YouTube Channel](https://www.youtube.com/user/medigerati/videos?flow=grid&sort=p&view=0)
                            about different topics around WebdriverIO created by on of our community members [Klamping](https://twitter.com/klamping).
                        </translate>
                    </MarkdownBlock>
                </div>
                <div
                    className="productShowcaseSection paddingTop"
                    style={{ textAlign: 'center' }}
                >
                    <a
                        className="button"
                        href="https://www.youtube.com/user/medigerati/videos"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <translate>Watch more videos</translate>
                    </a>
                </div>
            </div>
        </div>
    </Container>
)

Talks.propTypes = {
    language: PropTypes.string
}

const ApplitoolsSupport = () => (
    <Container background="light" padding={['bottom', 'top']} id="applitools">
        <div className="blockElement imageAlignSide imageAlignRight twoByGridBlock">
            <div className="blockContent">
                <h2>
                    <div>
                        <span>
                            <p>
                                <translate>Applitools Support</translate>
                            </p>
                        </span>
                    </div>
                </h2>
                <div>
                    <MarkdownBlock>
                        WebdriverIO comes with integrated support for [Applitools Eyes](https://applitools.com/)
                        allowing you to write seamless visual regression tests:

                        ![alt text](/img/applitools-test-code.png "Applitools Test")
                    </MarkdownBlock>
                </div>
            </div>
            <div className="blockImage">
                <img src={imgUrl('applitools.png')} />
            </div>
        </div>
    </Container>
)

const LOGOS = [
/**
 * Page 1
 */
{
    img: 'google.png',
    alt: 'Google',
    url: 'https://developers.google.com/blockly/'
}, {
    img: 'netflix.png',
    alt: 'Netflix',
    url: 'https://netflix.com/'
}, {
    img: 'microsoft.png',
    alt: 'Microsoft',
    url: 'https://www.microsoft.com/'
}, {
    img: 'mozilla.png',
    alt: 'Mozilla',
    url: 'https://www.mozilla.org/'
}, {
    img: 'buoyant.png',
    alt: 'Buoyant',
    url: 'https://buoyant.io/'
}, {
    img: 'sap.png',
    alt: 'SAP',
    url: 'https://www.sap.com/'
},
/**
 * Page 2
 */
{
    img: 'hilton.png',
    alt: 'Hilton',
    url: 'https://www.hilton.com/'
}, {
    img: 'github.png',
    alt: 'GitHub',
    url: 'https://www.electronjs.org/spectron'
}, {
    img: 'oxford.png',
    alt: 'Oxford University Press',
    url: 'https://global.oup.com/'
}, {
    img: 'bbva.png',
    alt: 'BBVA',
    url: 'https://www.bbva.com/'
}, {
    img: 'gopro.png',
    alt: 'GoPro',
    url: 'https://gopro.com/'
}, {
    img: 'algolia.png',
    alt: 'Algolia',
    url: 'https://www.algolia.com/'
},
/**
 * Page 3
 */
{
    img: 'financialtimes.png',
    alt: 'Financial Times',
    url: 'https://www.ft.com/'
}, {
    img: 'zendesk.png',
    alt: 'Zendesk',
    url: 'https://www.zendesk.com/'
}, {
    img: '1und1.png',
    alt: '1&1',
    url: 'https://www.1und1.de/'
}, {
    img: 'avira.png',
    alt: 'Avira',
    url: 'https://www.avira.com/'
}, {
    img: 'deloitte.jpg',
    alt: 'Deloitte',
    url: 'https://deloitte.com'
}, {
    img: 'rabobank.png',
    alt: 'Rabobank',
    url: 'https://www.rabobank.com/'
}]

const CompanyUsage = () => {
    return (
        <Container padding={['bottom', 'top']} id="companyUsage">
            <h3>Who is using WebdriverIO?</h3>
            <div>
                <ul>
                    {LOGOS.map((value, index) => (
                        <li key={index}><a href={value.url} target="_blank"><img src={"/img/logos/" + value.img} alt={value.alt} /></a></li>
                    ))}
                </ul>
                <div className="logoNavigation">
                    {[...Array(Math.ceil(LOGOS.length / 6))].map((_, index) => (
                        <button key={index} className={index === 0 ? 'active' : ''}>{index + 1}</button>
                    ))}
                </div>
            </div>
            <script src="/js/carousel.js"></script>
        </Container>
    )
}

class Index extends React.Component {
    render() {
        let language = this.props.language || ''

        return (
            <div>
                <HomeSplash language={language} />
                <div className="mainContainer">
                    <Container padding={['bottom', 'top']} background="light">
                        <GridBlock
                            align="center"
                            contents={[{
                                content: (
                                    <translate>
                                        Adding helper functions, or more complicated sets and combinations
                                        of existing commands is __simple__ and really __useful__
                                    </translate>
                                ),
                                image: imgUrl('teaser/extendable.png'),
                                imageAlign: 'top',
                                title: <translate>Extendable</translate>,
                            }, {
                                content: (
                                    <translate>
                                        WebdriverIO can be run on the [__WebDriver Protocol__](https://w3c.github.io/webdriver/)
                                        for true cross browser testing as well as [__Chrome DevTools Protocol__](https://chromedevtools.github.io/devtools-protocol/)
                                        for Chromium based automation using [Puppeteer](https://pptr.dev/).
                                    </translate>
                                ),
                                image: imgUrl('teaser/compatible.png'),
                                imageAlign: 'top',
                                title: <translate>Compatible</translate>,
                            }, {
                                content: (
                                    <translate>
                                        The huge variety of community plugins allows you to easily integrate
                                        and extend your setup to fulfill your requirements.
                                    </translate>
                                ),
                                image: imgUrl('teaser/featurerich.png'),
                                imageAlign: 'top',
                                title: <translate>Feature Rich</translate>,
                            }]}
                            layout="fourColumn"
                        />
                    </Container>
                    <CompanyUsage />
                    <Talks />
                    <ReactSupport />
                    <TestSetup />
                    <AutomationProtocolSupport />
                    <ApplitoolsSupport />
                </div>
            </div>
        )
    }
}

Index.propTypes = {
    language: PropTypes.string
}

module.exports = Index
