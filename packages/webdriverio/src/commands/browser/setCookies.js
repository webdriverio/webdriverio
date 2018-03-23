export default async function setCookies(cookieObjs) {
    const cookieObjsList = !Array.isArray(cookieObjs) ? [cookieObjs] : cookieObjs;

    if (cookieObjsList.some(obj => !(obj instanceof Object))) {
        throw new Error('Invalid input (see http://webdriver.io/api/cookie/setCookies.html for documentation.')
    }

    return Promise.all(cookieObjsList.map(cookieObj => this.addCookie(cookieObj)))
}
