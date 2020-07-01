/**
 * Error to be thrown when a sever error was encountered when a Service is being ran.
 */
export default class SevereServiceError extends Error {
    constructor(message = 'Sever Service Error occurred.') {
        super(message)
        this.name = 'SevereServiceError'
    }
}