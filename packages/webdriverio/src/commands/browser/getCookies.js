export default async function getCookies(names) {
    const namesList = typeof names !== 'undefined' && !Array.isArray(names) ? [names] : names

    if (typeof namesList === 'undefined') {
        return this.getAllCookies()
    }

    if (namesList.every(obj => typeof obj !== 'string')) {
        throw new Error('Invalid input (see http://webdriver.io/api/cookie/getCookies.html for documentation.')
    }

    const allCookies = await this.getAllCookies()

    return allCookies.filter(cookie => namesList.includes(cookie.name));
}
