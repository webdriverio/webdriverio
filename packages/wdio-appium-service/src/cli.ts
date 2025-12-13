import { determineAppiumCliCommand, extractPortFromCliArgs, startAppiumForCli } from './cli-utils.js'
import treeKill from 'tree-kill'
import { promisify } from 'node:util'

const promisifiedTreeKill = promisify<number, string>(treeKill)

export async function run() {
    const args: string[] = process.argv.slice(2)
    const port = extractPortFromCliArgs(args)
    const requiredFlags = ['--log-timestamp', '--allow-cors']

    if (!args.some(arg => arg.startsWith('--port'))) {
        args.push(`--port=${port}`)
    }

    requiredFlags.forEach(flag => {
        if (!args.includes(flag)) {
            args.push(flag)
        }
    })

    const command = await determineAppiumCliCommand()
    const serverArgs = ['server', ...args]

    console.log('🚀 Starting Appium server...')
    console.log(`📡 Command: ${command} ${serverArgs.join(' ')}`)
    console.log('⏳ Waiting for Appium server to be ready...')
    console.log('ℹ️  Press Ctrl+C to stop Appium server and exit\n\n')

    const appiumProcess = await startAppiumForCli(command, serverArgs)

    let isCleaningUp = false
    const cleanup = async () => {
        if (isCleaningUp) {
            return
        }
        isCleaningUp = true

        if (appiumProcess && appiumProcess.pid) {
            console.log('\n🛑 Stopping Appium server...')
            try {
                await promisifiedTreeKill(appiumProcess.pid, 'SIGTERM')
                console.log('✅ Appium server stopped successfully')
            } catch (err) {
                console.error('Error stopping Appium:', err)
            }
        }
        process.exit(0)
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    process.stdin.resume()
}
