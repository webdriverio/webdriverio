import path from 'path'

const TEST_ROOT = path.join(__dirname, '..')
const TEST_CONFIG_PARSER = path.join(TEST_ROOT, 'configparser.test.js')
const TEST_DATA_BACKEND = path.join(TEST_ROOT, 'detectBackend.test.js')

dataProvider(TEST_CONFIG_PARSER, ['data1'])
dataProvider(TEST_DATA_BACKEND, [{ url: 'url1', title: 'title1' }, { url: 'url2', title: 'title2' }])
