import React from 'react'

/**
 * Consistent layout for a documented option: type, default, allowed values, then the description.
 */
export default function Option ({
    type,
    default: defaultValue,
    values,
    name,
    required,
    contexts,
    children,
}: {
    type: string
    default?: string
    values?: string
    name?: string
    required?: string
    contexts?: string
    children?: React.ReactNode
}) {
    return (
        <div className="option">
            <dl className="optionMeta">
                {name && (
                    <div>
                        <dt>Name</dt>
                        <dd><code>{name}</code></dd>
                    </div>
                )}
                <div>
                    <dt>Type</dt>
                    <dd><code>{type}</code></dd>
                </div>
                {defaultValue !== undefined && (
                    <div>
                        <dt>Default</dt>
                        <dd>{renderValue(defaultValue)}</dd>
                    </div>
                )}
                {values && (
                    <div>
                        <dt>Values</dt>
                        <dd><code>{values}</code></dd>
                    </div>
                )}
                {required && (
                    <div>
                        <dt>Required</dt>
                        <dd><code>{required}</code></dd>
                    </div>
                )}
                {contexts && (
                    <div>
                        <dt>Contexts</dt>
                        <dd><code>{contexts}</code></dd>
                    </div>
                )}
            </dl>
            {children && <div className="optionBody">{children}</div>}
        </div>
    )
}

function renderValue (value: string) {
    if (value.includes('\n')) {
        return <pre className="optionDefaultBlock"><code>{value}</code></pre>
    }
    return <code>{value === '' ? '""' : value}</code>
}
