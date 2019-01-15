const express = require('express')
const path = require('path')
const fs = require('fs-extra')
const bodyParser = require('body-parser')
const cors = require('cors')
const io = require('./bin/io')
const NODE_ENV = process.env.NODE_ENV

const app = express()
const folderFrontend = '../frontend/dist'

app.use(cors())
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'dist')))

if (NODE_ENV === 'production') {
    fs.copy(folderFrontend, './dist')
        .then(() => {
            app.get('*', (req, res) => res.sendFile(path.join(__dirname, folderFrontend, 'index.html')))
        })
        .catch(err => {
            console.log(err)
            app.get('*', (req, res) => res.send('Invalid endpoint'))
        })
} else {
    app.get('*', (req, res) => res.send('Invalid endpoint'))
}

app.use('/api', require('./routes'))

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    res.status(500)
    res.render('error', { error: err })
})

const server = app.listen('8080', () => console.log(`Server ${NODE_ENV} started. http://localhost:8080`))

io.attach(server)
