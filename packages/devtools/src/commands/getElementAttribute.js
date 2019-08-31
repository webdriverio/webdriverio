import command from '../scripts/getElementAttribute'

export default async function getElementAttribute ({ elementId, name }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    const page = this.getPageHandle()
    return page.$eval('html', command, elementHandle, name)
}
