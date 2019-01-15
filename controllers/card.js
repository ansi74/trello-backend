const fs = require('fs-extra')
const io = require('../bin/io')
const uniqid = require('uniqid')

module.exports.add = (req, res, next) => {
    let { board, column } = req.body
    let folder = `dist/boards/${board}`
    let file = `${folder}/cards.json`
    let name = !req.body.name ? undefined : req.body.name.replace(/<\/?[^>]+>/g, '')
    let text = !req.body.text ? undefined : req.body.text.replace(/<\/?[^>]+>/g, '')

    if (!board) return res.json({ success: false, msg: 'board_does_not_exist' })
    if (!column) return res.json({ success: false, msg: 'column_required' })
    if (!name) return res.json({ success: false, msg: 'name_required' })
    if (!text) return res.json({ success: false, msg: 'text_required' })

    fs.pathExists(folder).then(result => {
        if (!result) return res.json({ success: false, msg: 'unknown_error' })

        fs.readJson(`${folder}/columns.json`)
            .then(data => {
                let searchColumn = data.findIndex(x => x.id === column)
                if (searchColumn < 0) return res.json({ success: false, msg: 'column_does_not_exist' })

                fs.readJson(file)
                    .then(data => {
                        data = !data || !data.length ? [] : data
                        data.push({
                            id: uniqid.time(),
                            column,
                            name,
                            nameLower: name.toLowerCase(),
                            text,
                            history: [],
                            created: new Date()
                        })
                        return data
                    })
                    .catch(() => {
                        return [
                            {
                                id: uniqid.time(),
                                column,
                                name,
                                nameLower: name.toLowerCase(),
                                text,
                                history: [],
                                created: new Date()
                            }
                        ]
                    })
                    .then(data => {
                        for (let index = 0; index < data.length - 1; index++) {
                            if (data[index].nameLower === name.toLowerCase() && data[index].column === column) {
                                return res.json({ success: false, msg: 'name_exists' })
                            }
                        }

                        io.emit('cardAdd', { board, column, data: data[data.length - 1] })

                        fs.writeJson(file, data).then(() => res.json({ success: true, data: data[data.length - 1] }))
                    })
            })
            .catch(() => res.json({ success: false, msg: 'unknown_error' }))
    })
}

module.exports.delete = (req, res, next) => {
    let { board, column, card } = req.body
    let folder = `dist/boards/${board}`
    let file = `${folder}/cards.json`

    if (!board) return res.json({ success: false, msg: 'board_does_not_exist' })
    if (!column) return res.json({ success: false, msg: 'column_required' })
    if (!card) return res.json({ success: false, msg: 'card_required' })

    fs.pathExists(folder).then(result => {
        if (!result) return res.json({ success: false, msg: 'unknown_error' })

        fs.readJson(file)
            .then(data => {
                let result = data
                let index = result.findIndex(x => x.id === card && x.column === column)

                if (index >= 0) {
                    result.splice(index, 1)
                    io.emit('cardDelete', { board, column, card })
                    fs.writeJson(file, result).then(() => res.json({ success: true, data: result }))
                } else res.json({ success: false, msg: 'unknown_error' })
            })
            .catch(() => res.json({ success: true, data: [] }))
    })
}

module.exports.edit = (req, res, next) => {
    let { board, column, card } = req.body
    let folder = `dist/boards/${board}`
    let file = `${folder}/cards.json`
    let name = !req.body.name ? undefined : req.body.name.replace(/<\/?[^>]+>/g, '')
    let text = !req.body.text ? undefined : req.body.text.replace(/<\/?[^>]+>/g, '')

    if (!board) return res.json({ success: false, msg: 'board_does_not_exist' })
    if (!column) return res.json({ success: false, msg: 'column_required' })
    if (!card) return res.json({ success: false, msg: 'card_required' })
    if (!name) return res.json({ success: false, msg: 'name_required' })
    if (!text) return res.json({ success: false, msg: 'text_required' })

    fs.pathExists(folder).then(result => {
        if (!result) return res.json({ success: false, msg: 'unknown_error' })

        fs.readJson(file)
            .then(data => {
                let result = data
                let index = result.findIndex(x => x.id === card && x.column === column)

                if (index >= 0) {
                    result[index].name = name
                    result[index].nameLower = name.toLowerCase()
                    result[index].text = text

                    io.emit('cardEdit', { board, column, card, data: result[index] })
                    fs.writeJson(file, result).then(() => res.json({ success: true, data: result[index] }))
                } else res.json({ success: false, msg: 'unknown_error' })
            })
            .catch(() => res.json({ success: true, data: [] }))
    })
}

module.exports.list = (req, res, next) => {
    let { board, column } = req.body
    let folder = `dist/boards/${board}`
    let file = `${folder}/cards.json`

    if (!board) return res.json({ success: false, msg: 'board_does_not_exist' })

    fs.pathExists(folder).then(result => {
        if (!result) return res.json({ success: false, msg: 'unknown_error' })

        fs.readJson(file)
            .then(data => {
                let result = column ? data.filter(item => item.column === column) : data
                res.json({ success: true, data: result })
            })
            .catch(() => res.json({ success: true, data: [] }))
    })
}

module.exports.transfer = (req, res, next) => {
    let { board, fromColumn, toColumn, toId, fromIndex, toIndex } = req.body
    let folder = `dist/boards/${board}`
    let file = `${folder}/cards.json`

    if (!board) return res.json({ success: false, msg: 'board_does_not_exist' })

    fs.pathExists(folder).then(result => {
        if (!result) return res.json({ success: false, msg: 'unknown_error' })

        fs.readJson(file)
            .then(data => {
                let result = data
                let fromResult = result.filter(x => x.column === fromColumn)
                let toResult = result.filter(x => x.column === toColumn)
                let endData

                if (fromColumn === toColumn) {
                    let [removed] = toResult.splice(fromIndex, 1)
                    toResult.splice(toIndex, 0, removed)

                    toResult[toIndex].history.push({ fromColumn, toColumn, fromIndex, toIndex, transfer: new Date() })

                    endData = result
                        .filter(x => x.column !== toColumn)
                        .concat(toResult)
                        .filter(x => x !== undefined && x !== null)
                } else {
                    let fromIndexCard = fromResult.findIndex(x => x.id === toId)
                    fromResult[fromIndexCard].column = toColumn
                    let [removed] = fromResult.splice(fromIndex, 1)
                    toResult.splice(toIndex, 0, removed)

                    toResult[toIndex].history.push({ fromColumn, toColumn, fromIndex, toIndex, transfer: new Date() })

                    endData = result
                        .filter(x => x.column !== toColumn && x.column !== fromColumn)
                        .concat(fromResult, toResult)
                        .filter(x => x !== undefined && x !== null)
                }

                io.emit('cardTransfer', { board, data: endData })
                fs.writeJson(file, endData).then(() => res.json({ success: true, data: endData }))
            })
            .catch(() => res.json({ success: true, data: [] }))
    })
}
