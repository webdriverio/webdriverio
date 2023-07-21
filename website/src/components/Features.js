import React from 'react'
import clsx from 'clsx'
import styles from './Feature.module.css'
import Feature from './Feature.js'

export default function Features ({ features }) {
    return (
        <div className={clsx(styles.features)}>
            {(features || []).map((props, idx) => (
                <Feature key={idx} {...props} />
            ))}
        </div>
    )
}
