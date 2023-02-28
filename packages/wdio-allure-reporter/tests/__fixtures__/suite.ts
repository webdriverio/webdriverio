import { sep } from 'node:path'

const suite = () => ({
    type: 'suite',
    start: '2018-05-14T15:17:18.914Z',
    _duration: 0,
    uid: 'A passing Suite2',
    cid: '0-0',
    title: 'A passing Suite',
    fullTitle: 'A passing Suite',
    file: ['foo', 'bar.test.js'].join(sep),
    tests: [],
    hooks: [],
    suites: []
} as any)

export function suiteStart(): WDIOReporter.Suite {
    return Object.assign(suite())
}

export function suiteEnd(): WDIOReporter.Suite {
    return Object.assign(suite(), { end: '2018-05-14T15:17:21.631Z', _duration: 2730 })
}
