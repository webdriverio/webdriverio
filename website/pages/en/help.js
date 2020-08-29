/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')

/* eslint-disable import/no-unresolved */
const CompLibrary = require('../../core/CompLibrary.js')
/* eslint-enable import/no-unresolved */

const Container = CompLibrary.Container
const GridBlock = CompLibrary.GridBlock

const siteConfig = require(process.cwd() + '/siteConfig.js')

function docUrl(doc, language) {
    return siteConfig.baseUrl + 'docs/' + (language ? language + '/' : '') + doc
}

class Help extends React.Component {
    render() {
        const supportLinks = [
            {
                content: `Learn more using the [documentation on this site.](${docUrl('gettingstarted.html')}).
                          Also make sure you check out the examples for individual commands.`,
                title: 'Browse Docs',
            },
            {
                content: `Ask questions about the documentation and project. WebdriverIO has one of the most active
                          [Gitter channels](https://gitter.im/webdriverio/webdriverio) with more than 3000 people.`,
                title: 'Join the community',
            },
            {
                content: "Find out what's new with this project by checking out our [blog](/blog)",
                title: 'Stay up to date',
            },
        ]

        return (
            <div className="docMainWrapper wrapper">
                <Container className="mainContainer documentContainer postContainer">
                    <div className="post">
                        <header className="postHeader">
                            <h1>Need help?</h1>
                        </header>
                        <p>This project is maintained by a dedicated group of people. Some are available for 1:1 help. Reach out to them:</p>

                        <ul>
                            <li><a href="https://www.codementor.io/@kevinlamping">Kevin Lamping</a></li>
                            <li><a href="https://github.com/webdriverio/webdriverio/blob/master/website/pages/en/help.js">Add your name to this list</a></li>
                        </ul>
                        <GridBlock contents={supportLinks} layout="threeColumn" />
                    </div>
                </Container>
            </div>
        )
    }
}

module.exports = Help
