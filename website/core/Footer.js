/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')
const PropTypes = require('prop-types')

class Footer extends React.Component {
    docUrl(doc, language) {
        const baseUrl = this.props.config.baseUrl
        return baseUrl + 'docs/' + (language ? language + '/' : '') + doc
    }

    pageUrl(doc, language) {
        const baseUrl = this.props.config.baseUrl
        return baseUrl + (language ? language + '/' : '') + doc
    }

    render() {
        return (
            <footer className="nav-footer" id="footer">
                <section className="sitemap">
                    <a href={this.props.config.baseUrl} className="nav-home">
                        {this.props.config.footerIcon && (
                            <img
                                src={this.props.config.baseUrl + this.props.config.footerIcon}
                                alt={this.props.config.title}
                                width="66"
                                height="58"
                            />
                        )}
                    </a>
                    <div>
                        <h5>Docs</h5>
                        <a href="/docs/gettingstarted.html">Getting Started</a>
                        <a href="/docs/api.html">API Reference</a>
                        <a href="/docs/contribute.html">Contribute</a>
                        <a href="/help.html">Help</a>
                    </div>
                    <div>
                        <h5>Community</h5>
                        <a
                            href="https://stackoverflow.com/questions/tagged/webdriver-io"
                            target="_blank"
                            rel="noreferrer noopener">
                            Stack Overflow
                        </a>
                        <a href="https://gitter.im/webdriverio/webdriverio">Support Chat</a>
                        <a href="https://seleniumhq.slack.com/join/shared_invite/enQtODAwOTUzOTM5OTEwLTZjZjgzN2ExOTBmZGE0NjkwYzA2Nzc0MjczMGYwYjdiNGQ5YjI0ZjdjYjFhMjVlMjFkZWJmNDYyMmU1OTYyM2Y">Slack</a>
                        <a
                            href="https://twitter.com/webdriverio"
                            target="_blank"
                            rel="noreferrer noopener">
                            Twitter
                        </a>
                    </div>
                    <div>
                        <h5>More</h5>
                        <a href={this.props.config.baseUrl + 'blog'}>Blog</a>
                        <a href="https://github.com/webdriverio/webdriverio">GitHub</a>
                        <a
                            className="github-button"
                            href={this.props.config.repoUrl}
                            data-icon="octicon-star"
                            data-count-href="/webdriverio/webdriverio/stargazers"
                            data-show-count={true}
                            data-count-aria-label="# stargazers on GitHub"
                            aria-label="Star this project on GitHub">
                            Star
                        </a>
                    </div>
                </section>
                <a
                    href="https://openjsf.org/projects/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="fbOpenSource">
                    <img
                        src={this.props.config.baseUrl + 'img/open-jsf-logo.svg'}
                        alt="OpenJS Foundation"
                        width="170"
                    />
                </a>
                <section className="copyright">{this.props.config.copyright}</section>
            </footer>
        )
    }
}

Footer.propTypes = {
    config: PropTypes.object,
    language: PropTypes.string
}

module.exports = Footer
