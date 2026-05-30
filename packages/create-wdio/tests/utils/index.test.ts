import { expect, test } from 'vitest'

import { SUPPORTED_PACKAGE_MANAGERS } from '../../src/utils/index.js'

test('should export SUPPORTED_PACKAGE_MANAGERS', async ()=>{
    expect(SUPPORTED_PACKAGE_MANAGERS).toBeDefined()
})
