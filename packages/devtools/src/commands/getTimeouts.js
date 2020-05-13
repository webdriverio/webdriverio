/**
 * 
 * The Get Timeouts command gets timeout durations associated with the current session.
 * 
 */

export default function getTimeouts () {
    return {
        implicit: this.timeouts.get('implicit'),
        pageLoad: this.timeouts.get('pageLoad'),
        script: this.timeouts.get('script')
    }
}
