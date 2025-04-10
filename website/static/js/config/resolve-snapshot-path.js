import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    resolveSnapshotPath: (testPath, snapExtension) => testPath + snapExtension,
})