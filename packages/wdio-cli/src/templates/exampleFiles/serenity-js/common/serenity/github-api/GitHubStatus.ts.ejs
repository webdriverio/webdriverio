import { Ensure, equals } from '@serenity-js/assertions'
import { Task } from '@serenity-js/core'
import { GetRequest, LastResponse, Send } from '@serenity-js/rest'

/**
 * Learn more about API testing with Serenity/JS
 *  https://serenity-js.org/handbook/api-testing/
 */
export class GitHubStatus {
    private static readonly baseApiUrl = 'https://www.githubstatus.com/api/v2/'
    private static readonly statusJson = this.baseApiUrl + 'status.json'

    static ensureAllSystemsOperational = () =>
        Task.where(`#actor ensures all GitHub systems are operational`,
            Send.a(GetRequest.to(this.statusJson)),
            Ensure.that(LastResponse.status(), equals(200)),
            Ensure.that(
                LastResponse.body<StatusResponse>().status.description.describedAs('GitHub Status'),
                equals('All Systems Operational')
            ),
        )
}

/**
 * Interfaces describing a simplified response structure returned by the GitHub Status Summary API:
 *  https://www.githubstatus.com/api/v2/summary.json
 */
interface StatusResponse {
    page: {
        id: string
        name: string
        url: string
        time_zone: string
        updated_at: string
    }
    status: {
        indicator: string
        description: string
    }
}
