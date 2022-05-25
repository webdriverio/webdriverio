import { vi } from 'vitest'
import tracelog from '../../../../packages/wdio-devtools-service/tests/__fixtures__/tracelog.json'

export const beginTrace = vi.fn()
export const endTrace = vi.fn().mockResolvedValue(tracelog)

export default class Driver {
    beginTrace: typeof beginTrace
    endTrace: typeof endTrace

    constructor (public connection: any) {
        this.beginTrace = beginTrace
        this.endTrace = endTrace
    }
}
