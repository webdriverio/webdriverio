export function createStepArgument ({ argument }) {
    if (!argument) {
        return undefined
    }

    if (argument.type === 'DataTable') {
        return [{
            rows: argument.rows.map(row => (
                { cells: row.cells.map(cell => cell.value) }
            ))
        }]
    }

    if (argument.type === 'DocString') {
        return argument.content
    }

    return undefined
}
