import { spawn } from 'child_process'
import path from 'path'
import Launcher from '../../../build/lib/launcher'

const STANDALONE_FLAG = '--run-launcher-standalone'

if (process.argv.includes(STANDALONE_FLAG)) {
    describe('run retries fixture as subprocess', () => {
        it('run', async () => {
            const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'retries.wdio.conf'))
            expect(await launcher.run()).to.be.equal(0)
        })
    })
} else {
    describe('retries', () => {
        let output = ''

        before(async () => {
            let args = [process.argv[1], STANDALONE_FLAG, ...process.argv.slice(2)]
            args = [...args.slice(0, args.findIndex(a => a.endsWith('setup-unit.js')) + 1), __filename]
            let child = spawn(process.argv[0], args, { env: { CI: true } })

            child.stdout.on('data', data => (output += data))
            await new Promise(resolve => child.on('close', resolve))
        })

        it('specfile-level retries', async () => {
            expect((output.match(/Retry file loaded\./g) || []).length).to.be.equal(2)
            expect((output.match(/Retry suite loaded\./g) || []).length).to.be.equal(2)
        })

        it('suite-level retries', async () => {
            expect((output.match(/Test for two retries loaded\./g) || []).length).to.be.equal(6)
        })

        it('test-level retries', async () => {
            expect((output.match(/Test for one retry loaded\./g) || []).length).to.be.equal(4)
            expect((output.match(/Test for zero retries loaded\./g) || []).length).to.be.equal(2)
        })
    })
}
