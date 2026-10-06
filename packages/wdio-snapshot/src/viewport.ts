import type { SnapshotNode } from './format.js'

/**
 * The part of a snapshot tree that is in the viewport: elements whose box
 * overlaps it, with their text. Text has no box of its own and goes with
 * its element.
 */
export function inViewport (node: SnapshotNode, width: number, height: number): SnapshotNode | undefined {
    const visible = (box?: number[]) => !box || (box[1] < height && box[1] + box[3] > 0 && box[0] < width && box[0] + box[2] > 0)
    // text directly in a container taller than the viewport could be anywhere in it
    const placesText = (box?: number[]) => Boolean(box) && box![3] <= height
    const keep = (current: SnapshotNode, root: boolean, parentPlacesText: boolean): SnapshotNode | undefined => {
        if (current.role === 'text') {
            return parentPlacesText ? current : undefined
        }
        if (!root && !visible(current.box)) {
            return undefined
        }
        const children = (current.children ?? [])
            .map((child) => keep(child, false, placesText(current.box)))
            .filter((child): child is SnapshotNode => Boolean(child))
        return { ...current, children }
    }
    return keep(node, true, false)
}
