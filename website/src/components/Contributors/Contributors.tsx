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

const ContributorList: React.FC = () => {
    const [contributors, setContributors] = useState<Contributor>([])

    useEffect(() => {
        const fetchContributors = async () => {
            const octokit = new Octokit()
            try {
                const response = await octokit.request('GET /repos/{owner}/{repo}/contributors?per_page=90', {
                    owner: 'webdriverio',
                    repo: 'webdriverio',
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                })
                setContributors(response.data)
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
                            toolName: <a href="https://developers.google.com/web/tools/lighthouse"><i>Webdriver.io</i></a>,
                        }}
                    >
                        {'We’d like to extend our heartfelt thanks to all the contributors who have helped make {toolName} the powerful tool it is today. Your dedication and effort are truly appreciated!'}
                    </Translate>
                </p>
                <div className="grid fade-horizontal">
                    {contributors.map((_, index) => {
                        if (index % 45 === 0) {
                            return (
                                <div className="grid-item" key={index}>
                                    {contributors.slice(index, index + 45).map((contributor) => (
                                        <a href={contributor.html_url} target="_blank">
                                            <img className="circle"
                                                key={contributor.login}
                                                src={contributor.avatar_url}
                                                alt={`${contributor.login}'s avatar`}
                                            />
                                        </a>
                                    ))}
                                </div>
                            )
                        }
                        return null
                    })}
                </div>
            </div>

        </>
    )
}

export default ContributorList
