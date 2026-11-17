import type { Session } from '../../types.js'

/**
 * `isKeyboardShown()`: the on-screen keyboard is open.
 * Mobilewright: `screen.keyboard.isVisible()`.
 * mobilecli: `device.io.keyboard.status`
 */
export async function isKeyboardShown (session: Session) {
    const status = await session.rpc.call<{ visible?: boolean }>('device.io.keyboard.status', { deviceId: session.device.id })
    return status?.visible === true
}
