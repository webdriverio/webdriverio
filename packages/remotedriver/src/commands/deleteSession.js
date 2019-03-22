export default async function navigateTo (connection) {
    const { Browser } = connection
    return Browser.close()
}
