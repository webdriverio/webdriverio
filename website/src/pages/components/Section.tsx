import React from 'react'
import styles from './Section.module.css'
import type { FC, ReactNode } from 'react'

type SectionProps = {
    isDark?: boolean
    children: ReactNode
}

const Section:FC<SectionProps> = ({ isDark, children }) => (
    <section className={[styles.section, ...(isDark ? [styles.darkSection, 'darkSection'] : [])].join(' ')}>
        <div className="container">
            <div className="row">
                {children}
            </div>
        </div>
    </section>
)

export default Section