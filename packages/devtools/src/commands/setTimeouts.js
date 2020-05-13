/**
 * 
 * The Set Timeouts command sets timeout durations associated with the current session. 
 * The timeouts that can be controlled are listed in the table of session timeouts below.
 * 
 */

export default async function setTimeouts ({ implicit, pageLoad, script }) {
    await this.setTimeouts(implicit, pageLoad, script)
    return null
}
