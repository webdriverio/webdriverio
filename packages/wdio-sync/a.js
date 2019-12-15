const deasync = require('deasync')
const fs = require('fs')
const net = require('net')

const syncWrite = deasync(fs.writeFile)

const superImportantExitSave = (data) => {
  syncWrite(__dirname + '/out.log', data)
  console.log('Wrote data: ' + data) // Never gets called
}

process.on('SIGINT', () => {
  superImportantExitSave('Aw shucks!')
})

const server = net.createServer((c) => {
  // 'connection' listener
  console.log('client connected')
  c.on('end', () => {
    console.log('client disconnected')
  })
  c.write('hello\r\n');
  c.pipe(c)
})

server.on('error', (err) => {
  throw err
})

server.listen(8124, () => {
  console.log('server bound')
})
