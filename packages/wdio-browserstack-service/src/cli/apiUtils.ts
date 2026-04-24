export default class APIUtils {
    static FUNNEL_INSTRUMENTATION_URL = 'https://api.devapplca.bsstag.com/sdk/v1/event'
    static BROWSERSTACK_AUTOMATE_API_URL = 'https://api.devapplca.bsstag.com'
    static BROWSERSTACK_AA_API_URL = 'https://api.devapplca.bsstag.com'
    static BROWSERSTACK_PERCY_API_URL = 'https://api.devapplca.bsstag.com'
    static BROWSERSTACK_AUTOMATE_API_CLOUD_URL = 'https://api-cloud.devapplca.bsstag.com'
    static BROWSERSTACK_AA_API_CLOUD_URL = 'https://api-cloud.devapplca.bsstag.com'
    static APP_ALLY_ENDPOINT = 'https://app-accessibility.devapplca.bsstag.com/automate'
    static DATA_ENDPOINT = 'https://collector-testhub-devapplca.bsstag.com'
    static UPLOAD_LOGS_ADDRESS = 'https://upload-observability.devapplca.bsstag.com'
    static EDS_URL = 'https://eds.devapplca.bsstag.com'

    static hasValidGRRUrls(apis?: Partial<GRRUrls>): apis is GRRUrls {
        return Boolean(
            apis?.automate?.api &&
            apis?.automate?.upload &&
            apis?.appAutomate?.api &&
            apis?.appAutomate?.upload &&
            apis?.percy?.api &&
            apis?.appAccessibility?.api &&
            apis?.observability?.api &&
            apis?.observability?.upload &&
            apis?.edsInstrumentation?.api
        )
    }

    static updateURLSForGRR(apis?: Partial<GRRUrls>) {
        if (!this.hasValidGRRUrls(apis)) {
            return false
        }

        this.FUNNEL_INSTRUMENTATION_URL = `${apis.automate.api}/sdk/v1/event`
        this.BROWSERSTACK_AUTOMATE_API_URL = apis.automate.api
        this.BROWSERSTACK_AA_API_URL = apis.appAutomate.api
        this.BROWSERSTACK_PERCY_API_URL = apis.percy.api
        this.BROWSERSTACK_AUTOMATE_API_CLOUD_URL = apis.automate.upload
        this.BROWSERSTACK_AA_API_CLOUD_URL = apis.appAutomate.upload
        this.APP_ALLY_ENDPOINT = `${apis.appAccessibility.api}/automate`
        this.DATA_ENDPOINT = apis.observability.api
        this.UPLOAD_LOGS_ADDRESS = apis.observability.upload
        this.EDS_URL = apis.edsInstrumentation.api

        return true
    }
}