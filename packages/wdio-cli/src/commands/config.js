import { runConfigHelper } from '../utils'

export const command = 'config'
export const desc = 'Initialize WebdriverIO and setup configuration in your current project.'

export const builder = {
    npm: {
        type: 'boolean',
        desc: 'Install packages via NPM'
    }
}

export async function handler(argv) {
    const { npm } = argv

    try {
        await runConfigHelper({ npm })
    } catch (error) {
        console.log('Error during setup: ', error.message)
    }
}
