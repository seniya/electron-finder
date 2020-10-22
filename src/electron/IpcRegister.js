// import getWindowsDrives from './util/getWindowsDrives'
const fs = require('fs')
const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const mime = require('mime-types')

class IpcRegister {
  constructor (ipcMain) {
    this.ipcMain = ipcMain
    this.drives_ = []
    this.fileInfos_ = []
  }

  registerOn () {
    this.ipcMain.on('req_system', async (event, res) => {
      this.drives_ = []
      this.fileInfos_ = []
      console.log('ipcMain.on : ', res)
      const fileInfos = await this.getWindowsDrives_()
      event.sender.send('res_system', JSON.stringify(fileInfos))
    })
  }

  async getWindowsDrives_ () {
    try {
      // eslint-disable-next-line no-unused-vars
      const { stdout, stderr } = await exec('wmic LOGICALDISK LIST BRIEF')
      // console.log('getWindowsDrives_ stdout : ', stdout)
      // console.log('getWindowsDrives_ stderr : ', stderr === '')
      const parts = stdout.split('\n')
      if (parts.length) {
        parts.splice(0, 1)
        for (let index = 0; index < parts.length; ++index) {
          const drive = parts[index].slice(0, 2)
          if (drive.length && drive[drive.length - 1] === ':') {
            try {
            // if stat fails, it'll throw an exception
              fs.statSync(drive + path.sep)
              this.drives_.push(drive)
            } catch (e) {
              console.error(`Cannot stat windows drive: ${drive}`, e)
            }
          }
        }
        // console.log('this.drives_ : ', this.drives_)
        for (let index = this.drives_.length - 1; index >= 0; --index) {
          try {
            const stat = fs.statSync(this.drives_[index] + path.sep)
            const fileInfo = {}
            fileInfo.rootDir = this.drives_[index]
            fileInfo.fileName = path.sep
            fileInfo.isDir = stat.isDirectory()
            fileInfo.stat = stat
            // console.log('fileInfo : ', fileInfo)
            const node = this.createNode(fileInfo)
            this.fileInfos_.push(node)
          } catch (error) {
          // remove from (bad/phantom) drive list
            this.drives_.splice(index, 1)
            console.error(error)
          }
        }
        return this.fileInfos_
      }
    } catch (error) {
      this.drive = []
      console.error('getWindowsDrives_ s: ', error)
    }
  }

  createNode (fileInfo) {
    let nodeKey = fileInfo.rootDir
    if (nodeKey.charAt(nodeKey.length - 1) !== path.sep) {
      nodeKey += path.sep
    }
    if (fileInfo.fileName === path.sep) {
      fileInfo.fileName = nodeKey
    } else {
      nodeKey += fileInfo.fileName
    }
    // get file mime type
    const mimeType = mime.lookup(nodeKey)
    // create object
    return {
      label: fileInfo.fileName,
      nodeKey: nodeKey,
      expandable: fileInfo.isDir,
      tickable: true,
      lazy: true,
      children: [],
      data: {
        rootDir: fileInfo.rootDir,
        isDir: fileInfo.isDir,
        mimeType: mimeType,
        stat: fileInfo.stat
      }
    }
  }
}

// import walkFolders from './util/walkFolders'
// import getWindowsDrives from './util/getWindowsDrives'

// const fs = require('fs')
// const path = require('path')

// console.log(walkFolders)
// console.log(getWindowsDrives)

// const platform = 'win32'
// // const drive = 'C:'
// const drives_ = []

// function getWindowsDrives_ () {
//   getWindowsDrives(platform, (error, drives) => {
//     console.log('drives : ', drives)
//     if (!error) {
//       drives_ = drives
//       // work through the drives backwards
//       for (let index = drives_.length - 1; index >= 0; --index) {
//         try {
//           const stat = fs.statSync(drives_[index] + path.sep)
//           const fileInfo = {}
//           fileInfo.rootDir = drives_[index]
//           fileInfo.fileName = path.sep
//           fileInfo.isDir = stat.isDirectory()
//           fileInfo.stat = stat
//         } catch (error) {
//           // remove from (bad/phantom) drive list
//           drives_.splice(index, 1)
//           console.error(error)
//         }
//       }
//     }
//   })
// }

// getWindowsDrives_()

// console.log('drives_ : ', drives_)

module.exports = IpcRegister
