import React, { useEffect, useState } from 'react'
import { Octokit } from '@octokit/rest'
import './contributors.css'
import Translate from '@docusaurus/Translate'

type Contributor = {
    login: string
    contributions: number
    html_url: string
    avatar_url: string
}

// per page max 99 items
type ContibutorProps = {
    contributorsPerPage: number;
    contributorsIgnore: Array<string>;
}

const defaultIgnoreContributors: string[] = ['wdio-bot', 'dependabot']
const ContributorList: React.FC = ({ contributorsPerPage = 99, contributorsIgnore = defaultIgnoreContributors }:ContibutorProps) => {
    const [contributors, setContributors] = useState<Contributor>([])
    useEffect(() => {
        const fetchContributors = async () => {
            const octokit = new Octokit()
            try {
                const response = await octokit.request(`GET /repos/{owner}/{repo}/contributors?per_page=${contributorsPerPage + contributorsIgnore.length}`, {
                    owner: 'webdriverio',
                    repo: 'webdriverio',
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                })
                const filteredContributors = response.data.filter((contribuidor: Contributor) =>
                    !contributorsIgnore.some(element =>
                        contribuidor.login.toLowerCase().includes(element.toLowerCase())
                    )
                )

                setContributors(filteredContributors)
            } catch (error) {
                console.error('Error fetching contributors:', error)
            }
        }

        fetchContributors()
    }, [])

    return (
        <>
            <div>
                <p className='intro'>
                    <Translate
                        id="contributors.thankYouMessage"
                        description="Thank you message for contributors"
                        values={{
                            toolName: <a href="https://webdriver.io"><i>WebdriverIO</i></a>
                        }}
                    >
                        {'We’d like to extend our heartfelt thanks to all the contributors who have helped make {toolName} the powerful tool it is today. Your dedication and effort are truly appreciated!'}
                    </Translate>
                </p>
                <div className="grid">
                    {[0, 1].map((value) => {
                        const middle = Math.ceil(contributors.length / 2)
                        const start = value === 0 ? 0 : middle
                        const end = value === 0 ? middle : contributors.length

                        return (
                            <div className="grid-item fade-horizontal" key={value}>
                                {contributors.slice(start, end).map((contributor) => (
                                    <a href={contributor.html_url} target="_blank" key={contributor.login}>
                                        <img
                                            className="circle"
                                            src={contributor.avatar_url}
                                            alt={`${contributor.login}'s avatar`}
                                        />
                                    </a>
                                ))}
                            </div>
                        )
                    })}
                </div>
            </div>

        </>
    )
}

export default ContributorList
