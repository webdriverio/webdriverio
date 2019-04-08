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

// function pageUrl(page, language) {
//     return siteConfig.baseUrl + (language ? language + '/' : '') + page
// }

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
            <a href="https://travis-ci.org/webdriverio/webdriverio"><img src="https://travis-ci.org/webdriverio/webdriverio.svg" alt="Build Status" /></a>
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
                        <Button href="https://learn.webdriver.io">Online Course</Button>
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
    <Block>
        {[
            {
                content: 'The wdio command line interface comes with a nice configuration utility that helps you to create your config file in less than a minute. It also gives an overview of all available 3rd party packages like framework adaptions, reporter and services and installs them for you.',
                image: imgUrl('config-utility.gif'),
                imageAlign: 'right',
                title: 'Easy Test Setup',
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
                    src="https://www.youtube.com/embed/fex2NlN-soQ?start=3204"
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
                            this talk from the latest "This.JavaScript: State of Frontend Testing" event about [The State of WebdriverIO v5](https://www.youtube.com/watch?v=fex2NlN-soQ&feature=youtu.be&t=3204)
                            by [@klamping](https://twitter.com/klamping). There is also a whole
                            [YouTube Channel](https://www.youtube.com/user/medigerati/videos?flow=grid&sort=p&view=0)
                            about different topics around WebdriverIO created by [him as well](https://twitter.com/klamping).
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
    <Container padding={['bottom', 'top']} id="applitools">
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

const TryIt = () => (
    <Block background="light">
        {[
            {
                content: 'You can try WebdriverIO using [try.webdriver.io](http://try.webdriver.io) that provides you with an interface to write a sample test and share it. You can also use it for debugging purposes.',
                image: imgUrl('try.png'),
                imageAlign: 'right',
                title: 'Try it out!',
            },
        ]}
    </Block>
)

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
                                        WebdriverIO has 1st class support for the __WebDriver specification__
                                        as well as to __Appium__ and allows to run tests on desktop and mobile.
                                    </translate>
                                ),
                                image: imgUrl('teaser/compatible.png'),
                                imageAlign: 'top',
                                title: <translate>Compatible</translate>,
                            }, {
                                content: (
                                    <translate>
                                        It implements all Webdriver protocol commands and provides useful
                                        integrations with other tools.
                                    </translate>
                                ),
                                image: imgUrl('teaser/featurerich.png'),
                                imageAlign: 'top',
                                title: <translate>Feature Rich</translate>,
                            }]}
                            layout="fourColumn"
                        />
                    </Container>
                    <TestSetup />
                    <Talks />
                    <ApplitoolsSupport />
                    <TryIt />
                </div>
            </div>
        )
    }
}

Index.propTypes = {
    language: PropTypes.string
}

module.exports = Index
