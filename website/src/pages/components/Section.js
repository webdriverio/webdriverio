import React from 'react'

import styles from './Section.module.css'

export default function Section({ isDark, children }) {
    return (
        <section className={[styles.section, ...(isDark ? [styles.darkSection, 'darkSection'] : [])].join(' ')}>
            <div className="container">
                <div className="row">
                    {children}
                </div>
            </div>
        </section>
    )
}

