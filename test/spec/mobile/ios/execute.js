import conf from '../../../conf/index'
import labels from '../../../fixtures/labels'

describe('native context execute', () => {
    before(async function () {
        await this.client.context(labels.NATIVE_APP_CONTEXT)
    })

    it('should be able to execute function objects', async function () {
        (await this.client.execute((a) => a + 2, 3)).value.should.be.equal(5)
    })

    it('should be able to execute strings', async function () {
        (await this.client.execute('return 3 + 2')).value.should.be.equal(5)
	})
})

describe('webview context execute', () => {
    before(async function () {
        await this.client.context(labels.WEBVIEW_CONTEXT)
    })

    it('should be able to execute function objects', async function () {
        (await this.client.execute((a) => a + 2, 3)).value.should.be.equal(5)
    })

    it('should be able to execute strings', async function () {
        (await this.client.execute('return 3 + 2')).value.should.be.equal(5)
	})
})
