import React from 'react'
import Link from '@docusaurus/Link'
import Translate from '@docusaurus/Translate'

import ImageSwitcher from './ImageSwitcher.tsx'

export default function Sponsors () {
    return <section className="sponsors">
        <h1>
            <Translate id="sponsors.title">
                Open Source and Open Governed
            </Translate>
        </h1>
        <p>
            <Translate id="sponsors.description.openSource" values={{
                openJsFoundationLink: (
                    <a href="https://openjsf.org/">OpenJS Foundation</a>
                ),
                linuxFoundationLink: (
                    <a href="https://linuxfoundation.org/">Linux Foundation</a>
                )
            }}>{`
                We are an open source project with a strong commitment to transparency and community governance.
                We are part of the {openJsFoundationLink} which is a part of the {linuxFoundationLink}. The project
                is entirely run by volunteers and funded by invested companies that want to see the project succeed.
                The project team is grateful for the generous sponsorship of these companies.
            `}</Translate>
        </p>
        <div className="sponsors-grid">
            <div className="premium">
                <h3>
                    <Translate id="sponsors.premiumSponsors">
                        💎 Premium Sponsors
                    </Translate>
                </h3>
                <div className="logos">
                    <ImageSwitcher
                        lightImageSrc="/img/sponsors/browserstack_black.svg"
                        darkImageSrc="/img/sponsors/browserstack_white.svg"
                        alt="BrowserStack"
                        link="https://www.browserstack.com/automation-webdriverio"
                        target="_blank"
                        style={{ width: '200px' }}
                    />
                </div>
            </div>
            <div className="gold">
                <h3>
                    <Translate id="sponsors.goldSponsors">
                        🥇 Gold Sponsors
                    </Translate>
                </h3>
                <div className="logos">
                    <ImageSwitcher
                        lightImageSrc="/img/sponsors/jetify_black.png"
                        darkImageSrc="/img/sponsors/jetify_white.png"
                        alt="Jetify"
                        link="https://www.jetify.com/"
                        width="150"
                        target="_blank"
                    />

                    <ImageSwitcher
                        lightImageSrc="/img/sponsors/testmu_ai_black.svg"
                        darkImageSrc="/img/sponsors/testmu_ai_white.svg"
                        alt="TestMu AI (Formerly LambdaTest)"
                        link="https://www.testmuai.com/"
                        width="200"
                        target="_blank"
                    />
                </div>
            </div>
        </div>
        <p>
            <Translate
                id="sponsors.description.support"
                values={{
                    becomeASponsor: (
                        <Link to="/docs/sponsor">
                            <Translate id="sponsors.becomeASponsor">
                                becoming a sponsor
                            </Translate>
                        </Link>
                    )
                }}>
                {
                    'If you use WebdriverIO within your organization, please consider supporting the project by {becomeASponsor}. ' +
                    'It will help us to keep the project running and evolving.'
                }
            </Translate>
        </p>
    </section>
}

