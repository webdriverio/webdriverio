export default function (data: string) {
    return data.slice(0, data.indexOf('export default function'))
}
