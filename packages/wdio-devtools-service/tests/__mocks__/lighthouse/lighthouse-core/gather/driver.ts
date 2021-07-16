import tracelog from '../../../../__fixtures__/tracelog.json'

export const beginTrace = jest.fn()
export const endTrace = jest.fn().mockResolvedValue(tracelog)

export default class Driver {
    beginTrace: jest.Mock
    endTrace: jest.Mock

    constructor () {
        this.beginTrace = beginTrace
        this.endTrace = endTrace
    }
}
