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

            if (command.name !== 'element' && command.name !== 'elements') {
                continue
            }
            if (command.name === 'element' && (!command.result[0].value || command.result[0].value.ELEMENT !== failingCommand.args[0])) {
                continue
            }

            for (let result of command.result.value) {
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
