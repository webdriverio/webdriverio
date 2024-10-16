import React from 'react'
import ImageSwitcher from './ImageSwitcher.tsx'

export default function Sponsors () {
    return <section className="sponsors">
        <h1>Open Source and Open Governed</h1>
        <p>
            We are an open source project with a strong commitment to transparency and community governance.
            We are part of the <a href="https://openjsf.org/">OpenJS Foundation</a>, which is a part of
            the <a href="https://linuxfoundation.org/">Linux Foundation</a>. The project is entirely run by volunteers
            and funded by invested companies that want to see the project succeed. The project team is grateful
            for the generous sponsorship of these companies.
        </p>
        <div className="sponsors-grid">
            <div className="premium">
                <h3>💎 Premium Sponsors</h3>
                <div className="logos">
                    <ImageSwitcher
                        lightImageSrc="/img/sponsors/browserstack_black.svg"
                        darkImageSrc="/img/sponsors/browserstack_white.svg"
                        alt="BrowserStack"
                        link="https://www.browserstack.com/automation-webdriverio"
                        target="_blank"
                        style={{ width: '200px' }}
                    />

                    <ImageSwitcher
                        lightImageSrc="/img/sponsors/saucelabs_black.svg"
                        darkImageSrc="/img/sponsors/saucelabs_white.svg"
                        alt="Sauce Labs"
                        link="https://www.saucelabs.com"
                        target="_blank"
                        width={400}
                        style={{ position: 'relative', top: '-2px', width: 200 }}
                    />
                </div>
            </div>
            <div className="gold">
                <h3>🥇 Gold Sponsors</h3>
                <div className="logos">
                    <ImageSwitcher
                        lightImageSrc="/img/sponsors/route4me.svg"
                        darkImageSrc="/img/sponsors/route4me.svg"
                        alt="Route4Me"
                        link="https://www.route4me.com/"
                        width="150"
                        target="_blank"
                    />
                </div>
            </div>
        </div>
        <p>
            If you use WebdriverIO within your organization, please consider supporting the project by <a href="/docs/sponsor">becoming a sponsor</a>.
            It will help us to keep the project running and evolving.
        </p>
    </section>
}

