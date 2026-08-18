/** Map that evicts the oldest entry once it would exceed `max` entries. */
export class CappedMap<K, V> extends Map<K, V> {
    constructor(private readonly max: number) {
        super()
    }

    set(key: K, value: V): this {
        if (this.size >= this.max && !this.has(key)) {
            this.delete(this.keys().next().value as K)
        }
        return super.set(key, value)
    }
}
