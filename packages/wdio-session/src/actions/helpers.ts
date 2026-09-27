import { formatHelpers, reloadHelpers, type LoadedHelper } from '../helpers.js'
import type { ActionFn } from '../session.js'

export const helpers: ActionFn = async (session, args) => {
    if (args.reload) {
        await reloadHelpers(session)
    }
    const loaded = session.get<LoadedHelper[]>('helpers') || []
    return { text: formatHelpers(loaded), data: { helpers: loaded } }
}
