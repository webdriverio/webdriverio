// The WebdriverIO.Browser / WebdriverIO.MultiRemoteBrowser accessibility
// augmentations (getAccessibilityResultsSummary, getAccessibilityResults,
// performScan, startA11yScanning, stopA11yScanning) now live in src/index.ts
// inside `declare global { namespace WebdriverIO { ... } }`, so that tsc emits
// them into build/index.d.ts for consumers. They were moved out of this ambient
// file to avoid duplicate-declaration conflicts. The setCustomTags augmentation
// stays here (it is not part of the a11y type-shipping fix).
declare namespace WebdriverIO {
    interface Browser {
        setCustomTags: (key: string, value: string) => Promise<void>
    }

    interface MultiRemoteBrowser {
        setCustomTags: (key: string, value: string) => Promise<void>
    }
}
