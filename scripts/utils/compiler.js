export default function (filepath, data) {
    return data.slice(0, data.indexOf('export default function'))
}
