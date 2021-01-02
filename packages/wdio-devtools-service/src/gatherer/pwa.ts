import Driver from 'lighthouse/lighthouse-core/gather/driver'
import pageFunctions from 'lighthouse/lighthouse-core/lib/page-functions'
import NetworkRecorder from 'lighthouse/lighthouse-core/lib/network-recorder'

import GatherRunner from 'lighthouse/lighthouse-core/gather/gather-runner'
import LinkElements from 'lighthouse/lighthouse-core/gather/gatherers/link-elements'
import ViewportDimensions from 'lighthouse/lighthouse-core/gather/gatherers/viewport-dimensions'

import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection'
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'

import collectMetaElements from '../scripts/collectMetaElements'
import { NETWORK_RECORDER_EVENTS } from '../constants'

export default class PWAGatherer {
    private _driver: typeof Driver
    private _networkRecorder: any
    private _networkRecords: any[] = []

    constructor (
        private _session: CDPSession,
        private _page: Page
    ) {
        /**
         * setup network recorder
         */
        this._networkRecorder = new NetworkRecorder()
        NETWORK_RECORDER_EVENTS.forEach((method) => {
            this._session.on(method, (params) => this._networkRecorder.dispatch({ method, params }))
        })

        /**
         * setup LH driver
         */
        const connection = this._session as any
        connection.sendCommand = (method: any, sessionId: never, ...paramAgrs: any[]) =>
            this._session.send(method as any, ...paramAgrs)
        this._driver = new Driver(connection)
        // @ts-ignore
        this._session['_connection']._transport._ws.addEventListener(
            'message',
            (message: { data: string }) => this._driver._handleProtocolEvent(JSON.parse(message.data))
        )

        /**
         * clean up network records after every page load
         */
        this._page.on('load', () => {
            this._networkRecords = this._networkRecorder.getRecords()
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
        const { versions } = await this._driver.getServiceWorkerVersions()
        const { registrations } = await this._driver.getServiceWorkerRegistrations()
        return {
            URL: { requestedUrl: pageUrl, finalUrl: pageUrl },
            WebAppManifest: await GatherRunner.getWebAppManifest(passContext),
            InstallabilityErrors: await GatherRunner.getInstallabilityErrors(passContext),
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
