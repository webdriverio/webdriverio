// test/hooks.mjs

export const mochaHooks = {
    beforeEach(done) {
        console.log('YESYOAHHH')
        // do something before every test
        done()
    }
}
