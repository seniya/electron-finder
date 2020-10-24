<template>
  <div ref="mainWrapper" class="main-wrapper" @mousemove="onHandleColumsMove" @mouseup="onHandleColumsUp">
    <div ref="foldersBox" class="list-box folders-box">
      <v-treeview
        :items="myPc"
        activatable
        color="warning"
        dense
        rounded
        :load-children="onSelectedFolder"
        :active.sync="active"
        :open.sync="open"
        >
          <template v-slot:label="{ item }">
            <a @dblclick="onDbSelectedFolder(item)">{{item.label}}</a>
            <!-- <v-btn @click="onSelectedFolder(item, item.nodeKey)">{{item.label}}</v-btn> -->
            <!-- <v-btn >{{item.label}}</v-btn> -->
          </template>
        </v-treeview>

    </div>
    <div ref="listBoxHandler" class="list-box-handler" @mousedown="onHandleColumsDown"></div>
    <div ref="filesBox" class="list-box files-box">
      <v-list-item v-for="(item, index) in contents" :key="index + '_' + item.id">
        <v-list-item-content>
          <v-list-item-title>{{item.name}}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </div>
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
      mainWrapper: this.$refs.mainWrapper,
      foldersBox: this.$refs.foldersBox,
      listBoxHandler: this.$refs.listBoxHandler,
      isHandlerDragging: false,

      myPc: [],
      displayItems: [],
      drives: [],
      selectedFolder: null, // the selected node (label)
      contents: [], // children of a node
      active: [],
      open: []
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
      const orderItems = _.orderBy(items, ['label'], ['asc'])
      console.log('orderItems : ', orderItems)

      const myPc = [{
        id: 'ROOT',
        name: '내PC',
        label: '내PC',
        nodeKey: 'ROOT',
        expandable: true,
        tickable: true,
        lazy: true,
        children: orderItems
      }]
      this.myPc = myPc
    })
  },

  mounted () {
    this.onHandleColumsInit()
  },

  watch: {
    active (newValue, oldValue) {
      if (newValue.length === 0 && oldValue.length === 1) {
        newValue.push(oldValue[0])
      }
    },
    open (newValue, oldValue) {
      console.log('open newValue : ', newValue)
      console.log('open oldValue : ', oldValue)
    }
  },

  methods: {
    onHandleColumsDown (e) {
      if (e.target === this.listBoxHandler) {
        this.isHandlerDragging = true
      }
    },
    onHandleColumsUp (e) {
      this.isHandlerDragging = false
    },
    onHandleColumsMove (e) {
      if (!this.isHandlerDragging) {
        return false
      }
      var containerOffsetLeft = this.mainWrapper.offsetLeft
      var pointerRelativeXpos = e.clientX - containerOffsetLeft
      var boxAminWidth = 60
      const width = (Math.max(boxAminWidth, pointerRelativeXpos - 8)) + 'px'
      this.foldersBox.style.width = width
      this.foldersBox.style.flexGrow = 0
    },
    onHandleColumsInit () {
      this.mainWrapper = this.$refs.mainWrapper
      this.foldersBox = this.$refs.foldersBox
      this.listBoxHandler = this.$refs.listBoxHandler
    },

    clearAllContentItems () {
      this.contents.splice(0, this.contents.length)
    },

    onSelectedFolder (item) {
      // console.log('onSelectedFolder item : ', item)
      // console.log('onSelectedFolder active: ', this.active)
      // console.log('onSelectedFolder open: ', this.open)
      const absolutePath = item.nodeKey
      this.setSelectedFolder(item, absolutePath)
    },

    onDbSelectedFolder (item) {
      console.log('onDbSelectedFolder item : ', item)
      this.open.push(item.id)
    },

    setSelectedFolder (item, folder) {
      this.selectedFolder = folder
      if (process.platform === 'win32') {
        if (this.selectedFolder.charAt(this.selectedFolder.length - 1) === ':') {
          this.selectedFolder += path.sep
        }
      }
      this.loadChildren(item, this.selectedFolder)
    },
    loadChildren (node, key) {
      try {
        if (node.children.length) {
          node.children.splice(0, node.children.length)
        }

        // const logs = walkFolders(key, 0)
        // console.log('node : ', node)
        console.log('key : ', key)

        for (const fileInfo of walkFolders(key, 0)) {
          // console.log('fileInfo : ', fileInfo)
          /**/
          if (!fileInfo.isDir) {
            continue
          }
          const n = this.createNode(fileInfo)
          node.children.push(n)
        }
        console.log('node : ', _.cloneDeep(node))
        return true
      } catch (err) {
        // usually access error
        console.error('Error: ', err)
      }
      return false
    },

    getFolderContents (folder) {
      const contents = []

      // check incoming arg
      if (!folder || typeof folder !== 'string') {
        return contents
      }

      for (const fileInfo of walkFolders(folder, 0)) {
        // all files and folders
        if ('error' in fileInfo) {
          console.error(`Error: ${fileInfo.rootDir} - ${fileInfo.error}`)
          continue
        }
        const node = this.createNode(fileInfo)
        contents.push(node)
      }

      return contents
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
        id: nodeKey,
        name: fileInfo.fileName,
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

<style lang="scss" scoped>

.main-wrapper {
  position: relative;
  /* Use flexbox */
  display: flex;
  height: 100%;
  min-height: 100%;

  .list-box-handler {
    width: 2px;
    padding: 0;
    cursor: ew-resize;
    flex: 0 0 auto;
    background-color: #ccc;
  }

  .list-box {
    position: relative;
    height: 100%;
    min-height: 100%;
    color: #fff;
    border-radius: 5px;
    padding: 20px;
    font-size: 150%;
    box-sizing: border-box;
    flex: 1 1 auto;

    .list-box-handler::before {
      content: '';
      display: block;
      width: 1px;
      height: 100%;
      background: #999;
      margin: 0 auto;
    }

    .folders-box {
      overflow-y: scroll;
    }

    .files-box {
      overflow: scroll;
    }
  }
}

</style>
