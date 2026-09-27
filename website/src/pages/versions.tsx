import React from 'react'
import Link from '@docusaurus/Link'
import Translate, { translate } from '@docusaurus/Translate'
import Layout from '@theme/Layout'

import versions from '../../docusaurusVersions'

function Version() {
    return (
        <Layout
            title="Versions"
            description={translate({
                id: 'versions.description',
                message: 'All hosted versions of the WebdriverIO documentation'
            })}>
            <main className="container margin-vert--lg">
                <h1>
                    <Translate>WebdriverIO documentation versions</Translate>
                </h1>

                <p>
                    <Translate>
                        The project team releases new major versions roughly on a yearly cadence. The
                        documentation of the current major version and the previous major version is
                        hosted. Documentation of older versions has been retired, please upgrade using
                        the migration guides.
                    </Translate>
                </p>

                <table>
                    <tbody>
                        {versions.map((version) => (
                            <tr key={version.name}>
                                <th>{version.label}</th>
                                <td>
                                    <Link to={version.path}><Translate>Documentation</Translate></Link>
                                </td>
                                <td>
                                    <a href={`${version.repoUrl}/blob/${version.branch}/CHANGELOG.md`}>
                                        <Translate>Release Notes</Translate>
                                    </a>
                                </td>
                                <td>{version.comment}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <p>
                    <Link to="/docs/v10-migration">
                        <Translate>Upgrading from v9? Read the v10 migration guide.</Translate>
                    </Link>
                </p>
            </main>
        </Layout>
    )
}

export default Version
