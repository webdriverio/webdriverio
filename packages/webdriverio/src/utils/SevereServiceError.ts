/**
 * Error to be thrown when a severe error was encountered when a Service is being ran.
 */
export default class SevereServiceError extends Error {
    constructor(message = 'Severe Service Error occurred.') {
        super(message)
        this.name = 'SevereServiceError'
    }
}