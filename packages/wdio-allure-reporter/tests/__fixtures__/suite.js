const suite = () => ({
    type: 'suite',
    start: '2018-05-14T15:17:18.914Z',
    _duration: 0,
    uid: 'A passing Suite2',
    cid: '0-0',
    title: 'A passing Suite',
    fullTitle: 'A passing Suite',
    tests: [],
    hooks: [],
    suites: []
})

export function suiteStart() {
    return Object.assign(suite())
}

export function suiteEnd() {
    return Object.assign(suite(), {end: '2018-05-14T15:17:21.631Z', _duration: 2730})
}
