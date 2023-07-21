import { vi } from 'vitest'
const chokidar: any = {}
chokidar.watch = vi.fn().mockReturnValue(chokidar)
chokidar.on =vi.fn().mockReturnValue(chokidar)

export default chokidar
