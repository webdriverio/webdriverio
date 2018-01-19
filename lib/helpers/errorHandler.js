import q from 'q'

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

        /**
         * verify the commandList array is actually defined to avoid a crash
         */
        if (!this.commandList || !this.commandList.slice) {
            return
        }
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

                    /**
                     * when using elements as first citizen , e.g. div.getTagName() and rerun
                     * the command due to StaleElementReference exception we store the unshifted
                     * `null` as selector. In order to have a valid selector when rerunning it we
                     * have to put in the actual selector
                     */
                    const preSelector = this.commandList[i].result.selector
                    if (commandToRepeat.args[0] === null && typeof preSelector === 'string') {
                        commandToRepeat.args[0] = preSelector

                        /**
                         * clear lastResult as we inject the actual selector to parameter list
                         */
                        if (this.lastResult) {
                            delete this.lastResult.value
                        }
                    }

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

        /**
         * reset lastPromise so we can resolve it after rerun
         */
        this.lastPromise = q()

        return this[commandToRepeat.name].apply(this, commandToRepeat.args)
    }
]
