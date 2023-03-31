/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Link from '@docusaurus/Link'
import Layout from '@theme/Layout'

function Version() {
    const { siteConfig } = useDocusaurusContext()
    const repoUrl = `https://github.com/${siteConfig.organizationName}/${siteConfig.projectName}`
    const pastVersions = [{
        name: 'v8',
        path: 'https://webdriver.io',
        comment: 'Stable',
        repoUrl
    }, {
        name: 'v7',
        label: 'v7',
        path: 'https://v7.webdriver.io',
        comment: (
            <div>
                <b>LTS</b> (until October 2023)
            </div>
        ),
        repoUrl
    }, {
        name: 'v6',
        label: 'v6',
        path: 'https://v6.webdriver.io',
        comment: (
            <div>
                <b>Deprecated</b> (since February 2022)
            </div>
        ),
        repoUrl
    }, {
        name: 'v5',
        label: 'v5',
        path: 'https://v5.webdriver.io',
        comment: (
            <div>
                <b>Deprecated</b> (since January 2021)
            </div>
        ),
        repoUrl
    }, {
        name: 'v4',
        label: 'v4',
        path: 'http://v4.webdriver.io',
        comment: (
            <div>
                <b>Deprecated</b> (since December 2019)
            </div>
        ),
        branch: 'master',
        repoUrl: 'https://github.com/webdriverio-boneyard/v4'
    }]

    const stableVersion = pastVersions.shift()

    return (
        <Layout
            title="Versions"
            permalink="/versions"
            description="Docusaurus 2 Versions page listing all documented site versions">
            <main className="container margin-vert--lg">
                <h1>WebdriverIO documentation versions</h1>

                <p>
                The project team releases new major versions roughly on a
                yearly cadence. LTS release status is "long-term support",
                which typically guarantees that critical bugs will be fixed
                for a total of 12 months until a new major release is made.
                </p>

                {stableVersion && (
                    <div className="margin-bottom--lg">
                        <h2 id="next">Current version (Stable)</h2>
                        <p>
                        Here you can find the documentation for current released version.
                        </p>
                        <table>
                            <tbody>
                                <tr>
                                    <th>{stableVersion.name}</th>
                                    <td>
                                        <Link to={stableVersion.path}>Documentation</Link>
                                    </td>
                                    <td>
                                        <a href={`${stableVersion.repoUrl}/blob/main/CHANGELOG.md`}>
                                        Release Notes
                                        </a>
                                    </td>
                                    <td>
                                        { stableVersion.comment }
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {pastVersions.length > 0 && (
                    <div className="margin-bottom--lg">
                        <h2 id="archive">Past versions</h2>
                        <p>
                        Here you can find documentation for previous versions of
                        Docusaurus.
                        </p>
                        <table>
                            <tbody>
                                {pastVersions.map((version) => (
                                    <tr key={version.name}>
                                        <th>{version.label}</th>
                                        <td>
                                            <Link to={version.path}>Documentation</Link>
                                        </td>
                                        <td>
                                            <a href={`${version.repoUrl}/blob/${version.branch || version.name}/CHANGELOG.md`}>
                                                Release Notes
                                            </a>
                                        </td>
                                        <td>
                                            { version.comment }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </Layout>
    )
}

export default Version
