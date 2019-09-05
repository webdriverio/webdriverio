import inquirer from 'inquirer'
import runConfigHelper from './runConfigHelper'

export default async function missingConfigurationPrompt(command, message) {
    try {
        const { config } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'config',
                message: `Error: Could not execute "${command}" due to missing configuration. Would you like to create one?`,
                default: false
            }
        ])

        if (!config) {
            console.log(message)
            process.exit(0)
        }

        await runConfigHelper({ exit: false })
    } catch (error) {
        throw new Error(error)
    }
}
