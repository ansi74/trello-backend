const io = require('socket.io')()

io.on('connection', socket => {
    console.log('User connected')

    socket.on('disconnect', () => {
        console.log('User Disconnected')
    })
})

module.exports = io
