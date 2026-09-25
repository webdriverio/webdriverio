import React from 'react'
import clsx from 'clsx'
import Translate from '@docusaurus/Translate'

import styles from './LogoCarousel.module.css'

const INTERVAL_LENGTH = 5000
const LOGO_WIDTH = 160

let ticks = 0

type LogoProps = {
    logos: Array<{
        img: string
        alt: string
        url: string
    }>
}

type LogoState = {
    position: number
    activePage: number
    swapInterval: ReturnType<typeof setInterval>
    pages: number
    logosPerPage: number
}

export default class LogoCarousel extends React.Component<LogoProps, LogoState> {
    containerRef: React.RefObject<HTMLDivElement>

    state: LogoState

    constructor(props: LogoProps) {
        super(props)
        this.state = {
            position: 0,
            activePage: 0,
            swapInterval: null,
            pages: 1,
            logosPerPage: 6,
        }
        this.containerRef = React.createRef()
    }

    componentDidMount() {
        this.measure()
        window.addEventListener('resize', this.measure)
        this.setState({
            swapInterval: setInterval(this.nextPage, INTERVAL_LENGTH),
        })
    }

    componentWillUnmount() {
        clearInterval(this.state.swapInterval)
        window.removeEventListener('resize', this.measure)
    }

    measure = () => {
        const width = this.containerRef.current?.getBoundingClientRect().width
        if (!width || !this.props.logos) {
            return
        }
        const logosPerPage = Math.max(1, Math.floor(width / LOGO_WIDTH))
        const pages = Math.ceil(this.props.logos.length / logosPerPage)
        this.setState((state) => {
            const activePage = Math.min(state.activePage, pages - 1)
            return {
                logosPerPage,
                pages,
                activePage,
                position: activePage * -logosPerPage * LOGO_WIDTH,
            }
        })
    }

    animateTo(i: number) {
        const page = Math.max(0, Math.min(i, this.state.pages - 1))
        this.setState({
            position: page * -this.state.logosPerPage * LOGO_WIDTH,
            activePage: page,
        })
    }

    handleClick(i: number) {
        this.animateTo(i)
        clearInterval(this.state.swapInterval)
        ticks = i
        this.setState({
            swapInterval: setInterval(this.nextPage, INTERVAL_LENGTH),
        })
    }

    nextPage = () => {
        const last = this.state.pages - 1
        if (last <= 0) {
            return
        }
        const direction = Math.floor(ticks / last) % 2
        this.animateTo(direction
            ? last - (ticks % last)
            : ticks % last
        )
        ++ticks
    }

    render() {
        if (!this.props?.logos) {
            return <div />
        }

        return (
            <div className={styles.companyUsage} ref={this.containerRef}>
                <h3>
                    <Translate id="homepage.logoCarousel.title">Who is using WebdriverIO?</Translate>
                </h3>
                <div className={styles.logos}>
                    <ul style={{ transform: `translate(${this.state.position}px, 0px)` }}>
                        {this.props.logos.map((value) => (
                            <li key={value.alt} style={{ flexBasis: LOGO_WIDTH, width: LOGO_WIDTH }}>
                                <a href={value.url} target="_blank" rel="noopener noreferrer">
                                    <img src={'/img/logos/' + value.img} alt={value.alt} />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={styles.logoNavigation}>
                    {[...Array(this.state.pages)].map((_, index) => (
                        <button
                            type="button"
                            onClick={() => this.handleClick(index)}
                            key={index}
                            aria-label={`Logo page ${index + 1}`}
                            aria-current={index === this.state.activePage ? 'true' : undefined}
                            className={clsx(styles.button, index === this.state.activePage && styles.buttonActive)}
                        />
                    ))}
                </div>
            </div>
        )
    }
}
