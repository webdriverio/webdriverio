import path from 'path'

export const TEST_ROOT = path.resolve(__dirname, '..')

export const data = new Map([
    [path.resolve(TEST_ROOT, 'configparser.test.js'), ['data1']],
    [path.resolve(TEST_ROOT, 'detectBackend.test.js'), [{ url: 'url1', title: 'title1' }, { url: 'url2', title: 'title2' }]]
])
