import DevTools from 'devtools'
import { expectType } from 'tsd'

async function bar () {
    const client = await DevTools.newSession({
        capabilities: {
            browserName: 'chrome'
        }
    })
    await client.setTimeouts(1, 2, 3)
    expectType<string>(await client.getTitle())

    client.createWindow('tab')
    client.createWindow('window')
}

export default {}
