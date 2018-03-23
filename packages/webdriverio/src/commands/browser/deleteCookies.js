export default async function deleteCookies(names) {
    const namesList = typeof names !== 'undefined' && !Array.isArray(names) ? [names] : names

    if (typeof namesList === 'undefined') {
        return await this.deleteAllCookies()
    }

    if (namesList.every(obj => typeof obj !== 'string')) {
        throw new Error('Invalid input (see http://webdriver.io/api/cookie/deleteCookies.html for documentation.')
    }

    return Promise.all(namesList.map(name => this.deleteCookie(name)))
}
