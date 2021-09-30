import FRGatherer from 'lighthouse/lighthouse-core/fraggle-rock/gather/session'
import pageFunctions from 'lighthouse/lighthouse-core/lib/page-functions'
import NetworkRecorder from 'lighthouse/lighthouse-core/lib/network-recorder'
import ProtocolSession from 'lighthouse/lighthouse-core/fraggle-rock/gather/session'

import InstallabilityErrors from 'lighthouse/lighthouse-core/gather/gatherers/installability-errors'
import WebAppManifest from 'lighthouse/lighthouse-core/gather/gatherers/web-app-manifest'
import LinkElements from 'lighthouse/lighthouse-core/gather/gatherers/link-elements'
import ViewportDimensions from 'lighthouse/lighthouse-core/gather/gatherers/viewport-dimensions'
import serviceWorkers from 'lighthouse/lighthouse-core/gather/driver/service-workers'

import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection'
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'

import collectMetaElements from '../scripts/collectMetaElements'
import { NETWORK_RECORDER_EVENTS } from '../constants'
import type { GathererDriver } from '../types'

export default class PWAGatherer {
    private _frGatherer: typeof FRGatherer
    private _protocolSession: typeof ProtocolSession
    private _networkRecorder: any
    private _networkRecords: any[] = []

    constructor (
        private _session: CDPSession,
        private _page: Page,
        private _driver: GathererDriver
    ) {
        this._frGatherer = new FRGatherer(this._session)
        this._protocolSession = new ProtocolSession(_session)

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
        const { registrations } = await serviceWorkers.getServiceWorkerRegistrations(this._protocolSession)
        const { versions } = await serviceWorkers.getServiceWorkerVersions(this._protocolSession)
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
