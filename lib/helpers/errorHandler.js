export default [
    /**
     * stale reference error handler
     */
    function (e) {
        if (!e.message.match('Element is no longer attached to the DOM')) {
            return
        }

        /**
         * get through command list and find most recent command where an element(s)
         * command contained the failing json web element
         */
        let failingCommand = this.commandList.slice(-1)[0]

        let cnt = this.commandList.length
        let commandToRepeat
        for (let command of this.commandList.reverse()) {
            cnt--
            if (command.name !== 'element' && command.name !== 'elements') {
                continue
            }
            if (command.name === 'element' && (!command.result[0].value || command.result[0].value.ELEMENT !== failingCommand.args[0])) {
                continue
            }

            for (let result of command.result.value) {
                if (result.ELEMENT === failingCommand.args[0]) {
                    commandToRepeat = this.commandList[--cnt]
                }
            }
        }

        if (!commandToRepeat) {
            return
        }

        console.log('repeat', commandToRepeat.name, '(', commandToRepeat.args[0], ')')
        return this[commandToRepeat.name].apply(this, commandToRepeat.args)
    }
]
