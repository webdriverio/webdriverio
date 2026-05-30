import { expect, test } from 'vitest'

test('should export config', async ()=>{
    const { config }= await import('../../src/config/cli.js')
    expect(config).toBeDefined()
})
