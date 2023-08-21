import { download as downloadEdgedriver } from 'edgedriver'
export type { EdgedriverParameters } from 'edgedriver'

export function setupEdgedriver(cacheDir: string, driverVersion?: string) {
    return downloadEdgedriver(driverVersion, cacheDir)
}
