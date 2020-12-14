const chokidar = {}
chokidar.watch = jest.fn().mockReturnValue(chokidar)
chokidar.on =jest.fn().mockReturnValue(chokidar)

export default chokidar
