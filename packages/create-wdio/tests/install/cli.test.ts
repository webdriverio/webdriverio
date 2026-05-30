import { expect, test } from 'vitest'

test('should export install', async ()=>{
    const { install }= await import('../../src/install/cli.js')
    expect(install).toBeDefined()
})
