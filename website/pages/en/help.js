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
                <Container className="mainContainer documentContainer postContainer paddingBottom">
                    <div className="post">
                        <header className="postHeader">
                            <h1>Need help?</h1>
                        </header>
                        <p>This project is maintained by a dedicated group of people.</p>

                        <p>If you're interested in making a contribution to the WebdriverIO project, check out <a href="./blog/2020/07/01/office-hours.html">the free "Office Hours" program</a> to help you with your efforts.</p>

                        <p>If you're seeking immediate help with your own project, reach out to a trusted WebdriverIO expert:</p>

                        <ul>
                            <li><a href="https://www.codementor.io/@kevinlamping">Kevin Lamping</a></li>
                            <li><a href="https://github.com/webdriverio/webdriverio/blob/master/website/pages/en/help.js">Add your name to this list</a></li>
                        </ul>

                        <p>Otherwise, check out these free resources:</p>

                        <GridBlock contents={supportLinks} layout="threeColumn" />
                    </div>
                </Container>
            </div>
        )
    }
}

module.exports = Help
