const { createServer } = require('http')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res))
  const io = new Server(httpServer)

  io.on('connection', (socket) => {
    socket.on('join-room', (matchId) => {
      socket.join(matchId)
    })

    socket.on('send-message', (data) => {
      socket.to(data.matchId).emit('receive-message', data)
    })
  })

  httpServer.listen(3000, () => {
    console.log('Server ready on http://localhost:3000')
  })
})