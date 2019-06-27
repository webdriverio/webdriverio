import path from 'path'

export const TEST_ROOT = path.resolve(__dirname, '..')

export const data = new Map([
    [path.resolve(TEST_ROOT, 'validateConfig.test.js'), ['val1', 'val2', 'val3']]
])
