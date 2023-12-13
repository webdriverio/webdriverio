export declare interface ElementSnapshotMatchers<R, T> {
    // ===== $ or $$ =====
    /**
      * This ensures that element html value matches the most recent snapshot with property matchers.
      */
    toMatchElementSnapshot(hint?: string): R;
    /**
     * This ensures that element html matches the most recent snapshot.
     */
    toMatchElementSnapshot<U extends Record<keyof T, unknown>>(
        propertyMatchers: Partial<U>,
        hint?: string,
    ): R;
    /**
     * This ensures that element html matches the most recent snapshot with property matchers.
     */
    toMatchElementInlineSnapshot(snapshot?: string): R;
    /**
     * This ensures that element html matches the most recent snapshot with property matchers.
     */
    toMatchElementInlineSnapshot<U extends Record<keyof T, unknown>>(
        propertyMatchers: Partial<U>,
        snapshot?: string,
    ): R;
}
