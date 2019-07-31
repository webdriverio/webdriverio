export default function findElements (_, xpath, root, dataProperty) {
    root = root || document
    const query = document.evaluate(xpath, root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE)

    if (query.snapshotLength === 0) {
        return false
    }

    for (let i = 0; i < query.snapshotLength; ++i) {
        query.snapshotItem(i).setAttribute(dataProperty, true)
    }

    return true
}
