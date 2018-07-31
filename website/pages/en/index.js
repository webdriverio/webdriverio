/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');
const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const siteConfig = require(process.cwd() + '/siteConfig.js');

function imgUrl(img) {
    return siteConfig.baseUrl + 'img/' + img;
}

function docUrl(doc, language) {
    return siteConfig.baseUrl + 'docs/' + (language ? language + '/' : '') + doc;
}

function pageUrl(page, language) {
    return siteConfig.baseUrl + (language ? language + '/' : '') + page;
}

class Button extends React.Component {
    render() {
        return (
            <div className="pluginWrapper buttonWrapper">
                <a className="button" href={this.props.href} target={this.props.target}>
                    {this.props.children}
                </a>
            </div>
        );
    }
}

Button.defaultProps = {
    target: '_self',
};

const SplashContainer = props => (
    <div className="homeContainer">
        <div className="homeSplashFade">
            <div className="wrapper homeWrapper">{props.children}</div>
        </div>
    </div>
);

const Logo = props => (
    <div className="projectLogo">
        <img src={props.img_src} />
    </div>
);

const Badges = () => (
    <section>
        <div class="badges">
            <a href="http://badge.fury.io/js/webdriverio" data-bindattr-34="34"><img src="https://badge.fury.io/js/webdriverio.svg" data-bindattr-35="35" class="retina-badge" /></a>
            <a href="https://travis-ci.org/webdriverio/v5"><img src="https://travis-ci.org/webdriverio/v5.svg" alt="Build Status" /></a>
            <a href="https://codecov.io/gh/webdriverio/v5"><img alt="CodeCov" src="https://codecov.io/gh/webdriverio/v5/branch/master/graph/badge.svg" /></a>
        </div>
        <div>
            <iframe src="https://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fwebdriver.io&width=118&layout=button_count&action=like&size=small&show_faces=true&share=true&height=46&appId=585739831492556" width="118" height="46" style={{ border: 'none', overflow: 'hidden'}} scrolling="no" frameborder="0" allowTransparency="true" allow="encrypted-media" id="fblike"></iframe>
            <iframe src="http://ghbtns.com/github-btn.html?user=webdriverio&amp;repo=webdriverio&amp;type=watch&amp;count=true" height="20" width="118" frameborder="0" scrolling="0" style={{ width: '118px', height: '20px' }} allowTransparency="true"></iframe>
            <a href="https://twitter.com/share" class="twitter-share-button" data-via="bromann" data-hashtags="webdriverio">Tweet</a>
            <a href="https://twitter.com/webdriverio" class="twitter-follow-button" data-show-count="true" data-lang="en">Follow @webdriverio</a>
        </div>
    </section>
);

const ProjectTitle = () => (
    <header>
        <h2 className="projectTitle">
            Webdriver <span>I/O</span>
        </h2>
        <small class="tagline">{siteConfig.tagline}</small>
        <Badges />
    </header>
);

const PromoSection = props => (
    <div className="section promoSection">
        <div className="promoRow">
            <div className="pluginRowBlock">{props.children}</div>
        </div>
    </div>
);

class HomeSplash extends React.Component {
    render() {
        let language = this.props.language || '';
        return (
            <SplashContainer>
                <Logo img_src={imgUrl('webdriverio.png')} />
                <div className="inner">
                    <ProjectTitle />
                    <PromoSection>
                        <Button href="#try">Try It Out</Button>
                        <Button href={docUrl('doc1.html', language)}>Example Link</Button>
                        <Button href={docUrl('doc2.html', language)}>Example Link 2</Button>
                    </PromoSection>
                </div>
            </SplashContainer>
        );
    }
}

const Block = props => (
    <Container
        padding={['bottom', 'top']}
        id={props.id}
        background={props.background}>
        <GridBlock align="center" contents={props.children} layout={props.layout} />
    </Container>
);

const Features = props => (
    <Block layout="fourColumn">
        {[
            {
                content: 'This is the content of my feature',
                image: imgUrl('docusaurus.svg'),
                imageAlign: 'top',
                title: 'Feature One',
            },
            {
                content: 'The content of my second feature',
                image: imgUrl('docusaurus.svg'),
                imageAlign: 'top',
                title: 'Feature Two',
            },
        ]}
    </Block>
);

const FeatureCallout = props => (
    <div
        className="productShowcaseSection paddingBottom"
        style={{textAlign: 'center'}}>
        <h2>Feature Callout</h2>
        <MarkdownBlock>These are features of this project</MarkdownBlock>
    </div>
);

const LearnHow = props => (
    <Block background="light">
        {[
            {
                content: 'Talk about learning how to use this',
                image: imgUrl('docusaurus.svg'),
                imageAlign: 'right',
                title: 'Learn How',
            },
        ]}
    </Block>
);

const TryOut = props => (
    <Block id="try">
        {[
            {
                content: 'Talk about trying this out',
                image: imgUrl('docusaurus.svg'),
                imageAlign: 'left',
                title: 'Try it Out',
            },
        ]}
    </Block>
);

const Description = props => (
    <Block background="dark">
        {[
            {
                content: 'This is another description of how this project is useful',
                image: imgUrl('docusaurus.svg'),
                imageAlign: 'right',
                title: 'Description',
            },
        ]}
    </Block>
);

const Showcase = props => {
    if ((siteConfig.users || []).length === 0) {
        return null;
    }
    const showcase = siteConfig.users
        .filter(user => {
            return user.pinned;
        })
        .map((user, i) => {
            return (
                <a href={user.infoLink} key={i}>
                    <img src={user.image} alt={user.caption} title={user.caption} />
                </a>
            );
        });

    return (
        <div className="productShowcaseSection paddingBottom">
            <h2>{"Who's Using This?"}</h2>
            <p>This project is used by all these people</p>
            <div className="logos">{showcase}</div>
            <div className="more-users">
                <a className="button" href={pageUrl('users.html', props.language)}>
                    More {siteConfig.title} Users
                </a>
            </div>
        </div>
    );
};

class Index extends React.Component {
    render() {
        let language = this.props.language || '';

        return (
            <div>
                <HomeSplash language={language} />
                <div className="mainContainer">
                    <Features />
                    <FeatureCallout />
                    <LearnHow />
                    <TryOut />
                    <Description />
                    <Showcase language={language} />
                </div>
            </div>
        );
    }
}

module.exports = Index;
