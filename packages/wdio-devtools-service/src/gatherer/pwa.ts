import FRGatherer from 'lighthouse/lighthouse-core/fraggle-rock/gather/session.js'
import pageFunctions from 'lighthouse/lighthouse-core/lib/page-functions.js'
import NetworkRecorder from 'lighthouse/lighthouse-core/lib/network-recorder.js'

import InstallabilityErrors from 'lighthouse/lighthouse-core/gather/gatherers/installability-errors.js'
import WebAppManifest from 'lighthouse/lighthouse-core/gather/gatherers/web-app-manifest.js'
import LinkElements from 'lighthouse/lighthouse-core/gather/gatherers/link-elements.js'
import ViewportDimensions from 'lighthouse/lighthouse-core/gather/gatherers/viewport-dimensions.js'
import serviceWorkers from 'lighthouse/lighthouse-core/gather/driver/service-workers.js'

import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection.js'
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page.js'

import collectMetaElements from '../scripts/collectMetaElements.js'
import { NETWORK_RECORDER_EVENTS } from '../constants.js'
import type { GathererDriver } from '../types'

export default class PWAGatherer {
    private _frGatherer: typeof FRGatherer
    private _networkRecorder: any
    private _networkRecords: any[] = []

    constructor (
        private _session: CDPSession,
        private _page: Page,
        private _driver: GathererDriver
    ) {
        this._frGatherer = new FRGatherer(this._session)

        /**
         * setup network recorder
         */
        this._networkRecorder = new NetworkRecorder()
        NETWORK_RECORDER_EVENTS.forEach((method) => {
            this._session.on(method, (params) => this._networkRecorder.dispatch({ method, params }))
        })

        /**
         * clean up network records after every page load
         */
        this._page.on('load', () => {
            this._networkRecords = this._networkRecorder.getRawRecords()
            delete this._networkRecorder
            this._networkRecorder = new NetworkRecorder()
        })
    }

    async gatherData () {
        const pageUrl = await this._page?.url()
        const passContext = {
            url: pageUrl,
            driver: this._driver
        }
        const loadData = {
            networkRecords: this._networkRecords
        }

        const linkElements = new LinkElements()
        const viewportDimensions = new ViewportDimensions()
        const { registrations } = await serviceWorkers.getServiceWorkerRegistrations(this._frGatherer)
        const { versions } = await serviceWorkers.getServiceWorkerVersions(this._frGatherer)
        return {
            URL: { requestedUrl: pageUrl, finalUrl: pageUrl },
            WebAppManifest: await WebAppManifest.getWebAppManifest(this._frGatherer, pageUrl),
            InstallabilityErrors: await InstallabilityErrors.getInstallabilityErrors(this._frGatherer),
            MetaElements: await this._driver.evaluate(collectMetaElements, {
                args: [],
                useIsolation: true,
                deps: [pageFunctions.getElementsInDocument],
            }),
            ViewportDimensions: await viewportDimensions.afterPass(passContext),
            ServiceWorker: { versions, registrations },
            LinkElements: await linkElements.afterPass(passContext, loadData)
        }
    }
}
