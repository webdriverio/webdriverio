export default [
    /**
     * stale reference error handler
     */
    function (e) {
        if (!e.seleniumStack || e.seleniumStack.type !== 'StaleElementReference') {
            return
        }

        /**
         * get through command list and find most recent command where an element(s)
         * command contained the failing json web element
         */
        let failingCommand = this.commandList.slice(-1)[0]

        let commandToRepeat
        for (let i = this.commandList.length - 1; i >= 0; --i) {
            const command = this.commandList[i]

            if (!command.result || !command.result.value) {
                continue
            }

            if (command.name !== 'element' && command.name !== 'elements') {
                continue
            }

            if (command.name === 'element' && (command.result.value.ELEMENT !== failingCommand.args[0])) {
                continue
            }

            // Ensure an array when evaluating the result, so the logic is the same for 'element' and 'elements' commands
            const results = Array.isArray(command.result.value) ? command.result.value : command.result.value !== null ? [command.result.value] : []

            for (let result of results) {
                if (result.ELEMENT === failingCommand.args[0]) {
                    commandToRepeat = this.commandList[i - 1]
                    break
                }
            }

            if (commandToRepeat) {
                break
            }
        }

        if (!commandToRepeat) {
            return
        }

        return this[commandToRepeat.name].apply(this, commandToRepeat.args)
    }
]
