/**
 * 
 * The Delete Session command closes any top-level browsing contexts associated 
 * with the current session, terminates the connection, and finally closes the current session.
 */

export default async function deleteSession () {
    await this.browser.close()
    return null
}
