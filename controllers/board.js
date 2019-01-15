const fs = require('fs-extra')
const uniqid = require('uniqid')

module.exports.check = (req, res, next) => {
    let board = !req.body.board ? uniqid.time() : req.body.board
    let folder = `dist/boards/${board}`
    let name = !req.body.name ? undefined : req.body.name.replace(/<\/?[^>]+>/g, '')

    fs.pathExists(folder).then(result => {
        if (!result) {
            if (!name) return res.json({ success: false, msg: 'name_required' })

            fs.outputJson(`${folder}/board.json`, { uid: board, name, created: new Date() }).then(() => {
                fs.readJson(`${folder}/board.json`).then(data => res.json({ success: true, data }))
            })
        } else {
            fs.readJson(`${folder}/board.json`).then(data => res.json({ success: true, data }))
        }
    })
}
