export default [
    /**
     * stale reference error handler
     */
    function (e) {
        if (!e.message.match('Element is no longer attached to the DOM')) {
            return
        }
        return Promise.reject(new Error('buhhhh'))
        return this.getTitle()
    }
]
