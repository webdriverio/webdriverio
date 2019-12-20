import command from '../scripts/getUrl'

export default async function getUrl () {
    const page = this.getPageHandle(true)
    return page.$eval('html', command)
}
