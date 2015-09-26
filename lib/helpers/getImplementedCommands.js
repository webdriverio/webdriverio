import path from 'path'
import fs from 'fs'

const COMMAND_TYPES = ['protocol', 'commands']

/**
 * helper to find all implemented commands
 *
 * @returns {String[]} list of implemented command names
 */
let getImplementedCommands = function () {
    let commands = {}

    for (let commandType of COMMAND_TYPES) {
        let dir = path.join(__dirname, '..', commandType)
        let files = fs.readdirSync(dir)

        for (let filename of files) {
            let commandName = filename.slice(0, -3)

            /**
             * addCommand only there for documentation purposes
             */
            if (commandName === 'addCommand') {
                continue
            }

            commands[commandName] = require(path.join(dir, commandName))
        }
    }

    return commands
}

export default getImplementedCommands
