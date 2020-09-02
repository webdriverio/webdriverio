import DevTools from 'devtools'

async function bar () {
    const client = await DevTools.newSession({})
    await client.setTimeouts(1, 2, 3)
    const title: string = await client.getTitle()

    client.createWindow('tab')
    client.createWindow('window')
    // @ts-expect-error
    client.createWindow('something else')
}

export default {}
