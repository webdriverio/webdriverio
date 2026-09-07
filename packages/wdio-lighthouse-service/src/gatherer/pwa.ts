import FRGatherer from 'lighthouse/core/gather/base-gatherer.js'
import { pageFunctions } from 'lighthouse/core/lib/page-functions.js'
import { NetworkRecorder } from 'lighthouse/core/lib/network-recorder.js'

import InstallabilityErrors from 'lighthouse/core/gather/gatherers/installability-errors.js'
import WebAppManifest from 'lighthouse/core/gather/gatherers/web-app-manifest.js'
import LinkElements from 'lighthouse/core/gather/gatherers/link-elements.js'
import ViewportDimensions from 'lighthouse/core/gather/gatherers/viewport-dimensions.js'
import { getServiceWorkerRegistrations, getServiceWorkerVersions } from 'lighthouse/core/gather/driver/service-workers.js'

import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/api/CDPSession.js'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'

import collectMetaElements from '../scripts/collectMetaElements.js'
import { NETWORK_RECORDER_EVENTS } from '../constants.js'
import type { NetworkRequest } from 'lighthouse/core/lib/network-request.js'
import type { ArbitraryEqualityMap, BaseArtifacts, Config, DevtoolsLog } from 'lighthouse/types/lh.js'
import type { Driver } from 'lighthouse/core/gather/driver.js'

export default class PWAGatherer {
    private _frGatherer: FRGatherer
    private _networkRecorder: NetworkRecorder
    private _networkRecords: NetworkRequest[] = []

    constructor (
        private _session: CDPSession,
        private _page: Page,
        private _driver: Driver
    ) {
        this._frGatherer = new FRGatherer()

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
            this._networkRecorder = new NetworkRecorder()
        })
    }

    async gatherData () {
        const pageUrl = await this._page?.url()
        const passContext = {
            url: pageUrl,
            driver: this._driver,
            gatherMode: 'navigation' as const,
            passConfig:  {} as Config.Pass, // TODO: populate with actual pass config
            settings: {} as Config.Settings, // TODO: populate with actual settings
            computedCache: new Map<string, ArbitraryEqualityMap>(),
            /** Gatherers can push to this array to add top-level warnings to the LHR. */
            LighthouseRunWarnings: [],
            baseArtifacts: {} as BaseArtifacts,
        }
        const loadData = {
            networkRecords: this._networkRecords,
            devtoolsLog: {} as DevtoolsLog // TODO: populate with actual devtools log from network recorder
        }

        const linkElements = new LinkElements()
        const viewportDimensions = new ViewportDimensions()
        const { registrations } = await getServiceWorkerRegistrations(this._frGatherer)
        const { versions } = await getServiceWorkerVersions(this._frGatherer)
        return {
            URL: { requestedUrl: pageUrl, finalUrl: pageUrl },
            WebAppManifest: await WebAppManifest.getWebAppManifest(this._frGatherer, pageUrl),
            InstallabilityErrors: await InstallabilityErrors.getInstallabilityErrors(this._frGatherer),
            // @ts-expect-error -- TODO to review
            MetaElements: await this._driver.evaluate(collectMetaElements, {
                args: [],
                useIsolation: true,
                deps: [pageFunctions.getElementsInDocument],
            }),
            ViewportDimensions: await viewportDimensions.getArtifact(passContext),
            ServiceWorker: { versions, registrations },
            LinkElements: await linkElements.afterPass(passContext, loadData)
        }
    }
}
