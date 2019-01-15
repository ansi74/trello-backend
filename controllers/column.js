const fs = require('fs-extra')
const io = require('../bin/io')
const uniqid = require('uniqid')

module.exports.add = (req, res, next) => {
    let { board } = req.body
    let folder = `dist/boards/${board}`
    let file = `${folder}/columns.json`
    let name = !req.body.name ? undefined : req.body.name.replace(/<\/?[^>]+>/g, '')

    if (!board) return res.json({ success: false, msg: 'board_does_not_exist' })
    if (!name) return res.json({ success: false, msg: 'name_required' })

    fs.pathExists(folder).then(result => {
        if (!result) return res.json({ success: false, msg: 'unknown_error' })

        fs.readJson(file)
            .then(data => {
                data = !data || !data.length ? [] : data
                data.push({ id: uniqid.time(), name, nameLower: name.toLowerCase(), created: new Date() })
                return data
            })
            .catch(() => {
                return [{ id: uniqid.time(), name, nameLower: name.toLowerCase(), created: new Date() }]
            })
            .then(data => {
                for (let index = 0; index < data.length - 1; index++) {
                    if (data[index].nameLower === name.toLowerCase()) {
                        return res.json({ success: false, msg: 'name_exists' })
                    }
                }

                io.emit('columnAdd', { board, data: data[data.length - 1] })

                fs.writeJson(file, data).then(() => res.json({ success: true, data: data[data.length - 1] }))
            })
    })
}

module.exports.delete = (req, res, next) => {
    let { board, column } = req.body
    let folder = `dist/boards/${board}`
    let file = `${folder}/columns.json`
    let fileCards = `${folder}/cards.json`

    if (!board) return res.json({ success: false, msg: 'board_does_not_exist' })
    if (!column) return res.json({ success: false, msg: 'column_required' })

    fs.pathExists(folder).then(result => {
        if (!result) return res.json({ success: false, msg: 'unknown_error' })

        fs.readJson(file)
            .then(data => {
                let result = data.filter(x => x.id !== column)

                fs.pathExists(fileCards).then(result => {
                    if (result) {
                        fs.readJson(fileCards).then(data =>
                            fs.writeJson(fileCards, data.filter(x => x.column !== column))
                        )
                    }
                })

                io.emit('columnDelete', { board, column })

                fs.writeJson(file, result).then(() => res.json({ success: true, data: result }))
            })
            .catch(() => res.json({ success: true, data: [] }))
    })
}

module.exports.edit = (req, res, next) => {
    let { board, column } = req.body
    let folder = `dist/boards/${board}`
    let file = `${folder}/columns.json`
    let name = !req.body.name ? undefined : req.body.name.replace(/<\/?[^>]+>/g, '')

    if (!board) return res.json({ success: false, msg: 'board_does_not_exist' })
    if (!column) return res.json({ success: false, msg: 'column_required' })
    if (!name) return res.json({ success: false, msg: 'name_required' })

    fs.pathExists(folder).then(result => {
        if (!result) return res.json({ success: false, msg: 'unknown_error' })

        fs.readJson(file)
            .then(data => {
                let result = data
                let index = result.findIndex(x => x.id === column)
                let nameExists = result.findIndex(x => x.nameLower === name.toLowerCase())

                if (nameExists >= 0) return res.json({ success: false, msg: 'name_exists' })

                result[index].name = name
                result[index].nameLower = name.toLowerCase()

                io.emit('columnEdit', { board, column, data: result[index] })

                fs.writeJson(file, result).then(() => res.json({ success: true, data: result[index] }))
            })
            .catch(() => res.json({ success: true, data: [] }))
    })
}

module.exports.list = (req, res, next) => {
    let { board } = req.body
    let folder = `dist/boards/${board}`
    let file = `${folder}/columns.json`

    if (!board) return res.json({ success: false, msg: 'board_does_not_exist' })

    fs.pathExists(folder).then(result => {
        if (!result) return res.json({ success: false, msg: 'unknown_error' })

        fs.readJson(file)
            .then(data => res.json({ success: true, data }))
            .catch(() => res.json({ success: true, data: [] }))
    })
}

module.exports.transfer = (req, res, next) => {
    let { board, column, fromIndex, toIndex } = req.body
    let folder = `dist/boards/${board}`
    let file = `${folder}/columns.json`

    if (!board) return res.json({ success: false, msg: 'board_does_not_exist' })
    if (!column) return res.json({ success: false, msg: 'column_required' })

    fs.pathExists(folder).then(result => {
        if (!result) return res.json({ success: false, msg: 'unknown_error' })

        fs.readJson(file)
            .then(data => {
                let result = data

                const [removed] = result.splice(fromIndex, 1)
                result.splice(toIndex, 0, removed)

                io.emit('columnTransfer', { board, column, fromIndex, toIndex })

                fs.writeJson(file, result).then(() => res.json({ success: true, data: result }))
            })
            .catch(() => res.json({ success: true, data: [] }))
    })
}
