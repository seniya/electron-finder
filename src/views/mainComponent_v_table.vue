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
        @update:active="onUpdateActiveFolder">
          <template v-slot:prepend="{ item, open }">
            <v-icon v-if="item.nodeKey === 'ROOT'" medium color="blue darken-3">
              mdi-desktop-classic
            </v-icon>
            <v-icon v-else medium color="blue darken-3">
              {{open ? 'mdi-folder-open' : 'mdi-folder'}}
            </v-icon>
          </template>
          <template v-slot:label="{ item }">
            <span class="folder-label-text">{{item.label}}</span>
          </template>
        </v-treeview>

    </div>
    <div ref="listBoxHandler" class="list-box-handler" @mousedown="onHandleColumsDown"></div>
    <div ref="filesBox" class="list-box files-box">
      <v-data-table
        :headers="headers"
        :items="contents"
        hide-default-footer
        :items-per-page="contents.length"
        item-key="nodeKey"
        class="elevation-1">
        <template v-slot:body="{ items }">
          <tbody>
            <tr v-for="item in items" :key="item.label">
              <td>
                <v-icon medium left>{{getFileIcon(item.data)}}</v-icon>
                <span>{{item.label}}</span>
              </td>
              <td>
                <span v-if="!item.data.isDir">{{getFileType(item.label)}}</span>
                <span v-else>폴더</span>
              </td>
              <td>
                <span>
                  {{getFileTime(item.data.stat.birthtimeMs)}}
                </span>
              </td>
              <td>
                <span v-if="!item.data.isDir">{{getFileSizeIEC(item.data.stat.size)}}</span>
              </td>
            </tr>
          </tbody>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import ICON_TYPE from '@/util/iconType'
import _ from 'lodash'
import moment from 'moment'
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')
console.log('path.sep : ', path.sep)

window.ipcRenderer = ipcRenderer

function * walkFolders (folder, recurseLevel = 0) {
  try {
    const files = fs.readdirSync(folder)
    // console.log('walkFolders folder : ', folder)
    // console.log('walkFolders files : ', files)

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

  computed: {
    headers () {
      return [
        {
          text: '이름',
          align: 'start',
          sortable: true,
          value: 'label'
        },
        { text: '타입', value: 'data.mimeType' },
        { text: '날짜', value: 'data.stat.birthtimeMs' },
        { text: '크기', value: 'data.stat.size' }
      ]
    }
  },

  watch: {
    // active (newValue, oldValue) {
    //   if (newValue.length === 0 && oldValue.length === 1) {
    //     newValue.push(oldValue[0])
    //   }
    // },
    // open (newValue, oldValue) {
    //   console.log('open newValue : ', newValue)
    //   console.log('open oldValue : ', oldValue)
    // }
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

    onUpdateActiveFolder (items) {
      console.log('onUpdateActiveFolder 시작 items[0] : ', items[0])
      console.log('onUpdateActiveFolder 시작 this.selectedFolder : ', this.selectedFolder)
      // if (items.length === 0 && this.selectedFolder !== null) {
      //   if (this.selectedFolder !== undefined) {
      //     this.active = [this.selectedFolder]
      //   }
      // }
      if (this.selectedFolder !== this.active[0]) {
        console.log('onUpdateActiveFolder 달라요 : ', items[0])
        this.selectedFolder = items[0] + path.sep
        this.clearAllContentItems()
        const newContents = this.getFolderContents(this.selectedFolder)
        console.log('newContents : ', newContents)
        this.contents.push(...newContents)
      }
      // console.log('onUpdateActiveFolder items : ', items)
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
      // this.open.push(item.id)
    },

    setSelectedFolder (item, folder) {
      // this.selectedFolder = folder
      // if (process.platform === 'win32') {
      //   if (this.selectedFolder.charAt(this.selectedFolder.length - 1) === ':') {
      //     this.selectedFolder += path.sep
      //   }
      // }
      folder += path.sep
      this.getFolders(item, folder)
    },
    getFolders (node, key) {
      try {
        if (node.children.length) {
          node.children.splice(0, node.children.length)
        }

        // const logs = walkFolders(key, 0)
        // console.log('node : ', node)
        // console.log('loadChildren key : ', key)

        for (const fileInfo of walkFolders(key, 0)) {
          // console.log('fileInfo : ', fileInfo)
          /**/
          if (!fileInfo.isDir) {
            continue
          }
          const n = this.createNode(fileInfo)
          node.children.push(n)
        }
        console.log('loadChildren node : ', _.cloneDeep(node))
        return true
      } catch (err) {
        // usually access error
        console.error('Error: ', err)
      }
      return false
    },

    getFolderContents (folder) {
      console.log('getFolderContents folder : ', folder)
      const contents = []

      // check incoming arg
      if (!folder || typeof folder !== 'string') {
        return contents
      }

      let newFolders = []
      let newFiles = []
      for (const fileInfo of walkFolders(folder, 0)) {
        // all files and folders
        if ('error' in fileInfo) {
          console.error(`Error: ${fileInfo.rootDir} - ${fileInfo.error}`)
          continue
        }
        const node = this.createNode(fileInfo)
        if (node.data.isDir) newFolders.push(node)
        if (!node.data.isDir) newFiles.push(node)
      }

      newFolders = _.orderBy(newFolders, ['label'], ['asc'])
      newFiles = _.orderBy(newFiles, ['label'], ['asc'])

      contents.push(...newFolders, ...newFiles)
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
    },

    getFileIcon (itemData) {
      // const returnValue = `(${itemData.mimeType})`
      let vIco = ICON_TYPE[itemData.mimeType]
      if (itemData.isDir) vIco = 'mdi-folder'
      if (vIco === undefined) vIco = 'mdi-file'
      // console.log(`mimeType: ${itemData.mimeType} / vIco: ${vIco}`)
      return vIco
    },

    getFileSizeIEC (a, b, c, d, e) {
      // console.log('fileSizeIEC a: ', a)
      b = Math
      c = b.log
      d = 1024
      e = c(a) / c(d) | 0
      return (a / b.pow(d, e)).toFixed(2) + ' ' + (e ? 'kMGTPEZY'[--e] + 'B' : 'Bytes')
    },
    getFileType (mimeType) {
      return mimeType.split('.').pop()
    },
    getFileTime (time) {
      return moment(this.time).format('YYYY-MM-DD HH:mm')
    }
  }
}
</script>

<style lang="scss" scope>

.main-wrapper {
  position: relative;
  /* Use flexbox */
  display: flex;
  height: 100%;
  min-height: 100%;

  .list-box-handler {
    width: 5px;
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
      width: 5px;
      height: 100%;
      background: #999;
      margin: 0 auto;
    }
  }

  .folders-box {
    overflow-y: scroll;
  }

  .files-box {
    overflow: scroll;
  }

  .folder-label-text{
    font-size: 0.9rem;
  }

  .v-treeview-node__root {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
  }

}

// $treeview-node-margin : 0px !default;
// $treeview-node-shaped-margin: 0px !default;
// $treeview-node-padding: 0px !default;
</style>
