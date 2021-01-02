export default class ViewportDimensionsMock {
    static getWebAppManifest = jest.fn().mockResolvedValue('getWebAppManifestResult')
    static getInstallabilityErrors = jest.fn().mockResolvedValue('getInstallabilityErrorsResult')
}
