export default [
    /**
     * stale reference error handler
     */
    function (e, command) {
        if (!e.message.match('Element is no longer attached to the DOM')) {
            return
        }

        console.log(this.commandList);

        console.log('stale element error handler')
        return Promise.reject(new Error('buhh'))
    }
]
