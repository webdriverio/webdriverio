
/**
 * Options pertaining to the creation and functionality of a {@link SpecPage}
 */
interface RenderOptions {
    /**
     * An array of components to test. Component classes can be imported into the spec file, then their reference should be added to the `component` array in order to be used throughout the test.
     */
    components: any[];
    /**
     * If `false`, do not flush the render queue on initial test setup.
     */
    flushQueue?: boolean;
    /**
     * The initial JSX used to generate the test.
     * Use `template` when you want to initialize a component using their properties, instead of their HTML attributes.
     * It will render the specified template (JSX) into `document.body`.
     */
    template?: () => any;
    /**
     * Sets the mocked `lang` attribute on `<html>`.
     */
    language?: string;
    /**
     * Useful for debugging hydrating components client-side. Sets that the `html` option already includes annotated prerender attributes and comments.
     */
    hydrateClientSide?: boolean;
    /**
     * Useful for debugging hydrating components server-side. The output HTML will also include prerender annotations.
     */
    hydrateServerSide?: boolean;
    /**
     * Sets the mocked `document.referrer`.
     */
    referrer?: string;
    /**
     * Manually set if the mocked document supports Shadow DOM or not. Default is `true`.
     */
    supportsShadowDom?: boolean;
    /**
     * When a component is pre-rendered it includes HTML annotations, such as `s-id` attributes and `<!-t.0->` comments. This information is used by clientside hydrating. Default is `false`.
     */
    includeAnnotations?: boolean;
    /**
     * By default, any changes to component properties and attributes must `page.waitForChanges()` in order to test the updates. As an option, `autoAppluChanges` continuously flushes the queue on the background. Default is `false`.
     */
    autoApplyChanges?: boolean;
    /**
     * By default, styles are not attached to the DOM and they are not reflected in the serialized HTML.
     * Setting this option to `true` will include the component's styles in the serializable output.
     */
    attachStyles?: boolean;
    /**
     * Set {@link BuildConditionals} for testing based off the metadata of the component under test.
     * When `true` all `BuildConditionals` will be assigned to the global testing `BUILD` object, regardless of their
     * value. When `false`, only `BuildConditionals` with a value of `true` will be assigned to the `BUILD` object.
     */
    strictBuild?: boolean;
}

interface StencilEnvironment {
    /**
     * After changes have been made to a component, such as a update to a property or
     * attribute, the test page does not automatically apply the changes. In order to
     * wait for, and apply the update, call await `flushAll()`.
     */
    flushAll: () => void
}

export function render(opts: RenderOptions): StencilEnvironment
