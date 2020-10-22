<template>
  <div>
    aaaa
    <v-list-item v-for="(drive, index) in drives" :key="index + '_' + drive.rootDir">
      <v-btn @click="onSelectedFolder(drive, drive.label)">{{drive.label}}</v-btn>
    </v-list-item>
    <div v-if="selectedFolder">selectedFolder : {{selectedFolder}}</div>

  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import _ from 'lodash'
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')
console.log('path.sep : ', path.sep)

window.ipcRenderer = ipcRenderer

function * walkFolders (folder, recurseLevel = 0) {
  try {
    const files = fs.readdirSync(folder)

    for (const file of files) {
      try {
        const pathToFile = path.join(folder, file)
        const stat = fs.statSync(pathToFile)
        const isDirectory = stat.isDirectory()
        if (isDirectory && recurseLevel > 0) {
          yield * walkFolders(pathToFile, recurseLevel - 1)
        } else {
          console.log('recurseLevel 0')
          yield {
            rootDir: folder,
            fileName: file,
            isDir: isDirectory,
            stat: stat
          }
        }
      } catch (err) {
        yield {
          rootDir: folder,
          fileName: file,
          error: err
        }
      }
    }
  } catch (err) {
    yield {
      rootDir: folder,
      error: err
    }
  }
}

export default {
  data () {
    return {
      platform: 'win32',
      drive: 'C:',
      drives: [],
      selectedFolder: null // the selected node (label)
    }
  },

  destroyed () {
    console.log('destroyed 22')
    window.ipcRenderer.removeAllListeners()
  },

  created () {
    console.log('created')
    window.ipcRenderer.send('req_system', 'request')
    window.ipcRenderer.on('res_system', (event, res) => {
      console.log('ipcRenderer on  s:', JSON.parse(res))
      const items = JSON.parse(res)
      this.drives = _.orderBy(items, ['label'], ['asc'])
    })
  },

  methods: {
    onSelectedFolder (node, absolutePath) {
      this.setSelectedFolder(node, absolutePath)
    },
    setSelectedFolder (node, folder) {
      this.selectedFolder = folder
      // handle windows drive
      if (process.platform === 'win32') {
        if (this.selectedFolder.charAt(this.selectedFolder.length - 1) === ':') {
          this.selectedFolder += path.sep
        }
      }
      this.loadChildren(node, this.selectedFolder)
    },
    loadChildren (node, key) {
      try {
        if (node.children.length) {
          node.children.splice(0, node.children.length)
        }
        for (const fileInfo of walkFolders(key, 0)) {
          // we only want folders
          if (!fileInfo.isDir) {
            continue
          }
          // create a new node
          const n = this.createNode(fileInfo)
          // add child to parent
          node.children.push(n)
          console.log('node : ', node)
        }
        return true
      } catch (err) {
        // usually access error
        console.error('Error: ', err)
      }
      return false
    },

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
}
</script>

<style>

</style>
