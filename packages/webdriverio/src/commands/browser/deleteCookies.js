export default function deleteCookies(names) {
    const namesList = typeof names !== 'undefined' && !Array.isArray(names) ? [names] : names

    if (typeof namesList === 'undefined') {
        return this.deleteAllCookies()
    }

    if (namesList.every(obj => typeof obj !== 'string')) {
        return Promise.reject(new Error('Invalid input (see http://webdriver.io/api/cookie/deleteCookies.html for documentation.'))
    }

    return Promise.all(namesList.map(name => this.deleteCookie(name)))
}
