import { notSupported } from '../errors.js'
import type { Session } from '../session.js'
import type { SnapshotOptions, TakenSnapshot } from '../actions/observe.js'

export async function takeNativeSnapshot (_session: Session, _opts: SnapshotOptions): Promise<TakenSnapshot> {
    throw notSupported('Native snapshots are not implemented yet.')
}
