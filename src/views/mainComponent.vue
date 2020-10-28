<template>
  <div ref="mainWrapper" class="main-wrapper" @mousemove="onHandleColumsMove" @mouseup="onHandleColumsUp" @mouseleave="onHandleColumsUp">

    <div ref="foldersBox" class="folders-box">
      <div ref="foldersBoxWrap" class="ld-wrap" :style="styleLeftSidebarWidth">
        <div ref="foldersBoxMain" class="ld-wrap-main" :style="styleLeftSidebarWidth">
          <v-treeview
            :items="myPc"
            activatable
            color="warning"
            dense
            rounded
            :load-children="onSelectedFolder"
            :active.sync="active"
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
      </div>
    </div>

    <div ref="listBoxHandler" class="list-box-handler" @mousedown="onHandleColumsDown"></div>

    <div ref="filesBox" class="files-box" :style="styleRightSidebarWidth">
      <div class="files-box-wrap" >
        <table class="file-box-table" :style="styleRightSidebarTableWidth">
          <thead>
            <th class="th-1" :style="styleRightSidebarTableTh1Width">이름</th>
            <th class="th-2">유형</th>
            <th class="th-3">수정된날짜</th>
            <th class="th-4">크기</th>
          </thead>
          <tbody>
            <tr v-for="item in contents" :key="item.label">
              <td class="td-1" >
                <v-icon medium left>{{$getFileIcon(item.data)}}</v-icon>
                  {{item.label}}
              </td>
              <td class="td-2">
                <span v-if="!item.data.isDir">{{$getFileType(item.label)}}</span>
                <span v-else>폴더</span>
              </td>
              <td class="td-3">
                <span>{{$getFileTime(item.data.stat.birthtimeMs)}}</span>
              </td>
              <td class="td-4">
                <span v-if="!item.data.isDir">{{$getFileSizeIEC(item.data.stat.size)}}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
window.ipcRenderer = ipcRenderer

export default {
  data () {
    return {
      mainWrapper: null,
      foldersBox: null,
      listBoxHandler: null,
      isHandlerDragging: false,
      leftSidebarWidth: 350,
      pathSep: '',
      myPc: [],
      displayItems: [],
      drives: [],
      selectedFolder: null,
      contents: [],
      active: []
    }
  },

  destroyed () {
    window.removeEventListener('resize', this.onWindowResize)
  },

  created () {
    this.initSystem()
    window.addEventListener('resize', this.onWindowResize)
  },

  mounted () {
    this.onHandleColumsInit()
  },

  computed: {
    styleLeftSidebarWidth () {
      return `width: ${this.leftSidebarWidth}px`
    },
    styleRightSidebarWidth () {
      const width = this.mainWrapper === null ? '100%' : this.mainWrapper.getBoundingClientRect().width - this.leftSidebarWidth - 30
      return `width: ${width}px`
    },
    styleRightSidebarTableWidth () {
      const width = this.mainWrapper === null ? '100%' : this.mainWrapper.getBoundingClientRect().width - this.leftSidebarWidth - 60
      return `width: ${width}px`
    },
    styleRightSidebarTableTh1Width () {
      const width = this.mainWrapper === null ? '100%' : this.mainWrapper.getBoundingClientRect().width - this.leftSidebarWidth - 60 - 290
      return `width: ${width}px`
    }
  },

  methods: {
    initSystem () {
      const res = window.ipcRenderer.sendSync('req_system')
      const resObj = JSON.parse(res)
      this.myPc = resObj.myPc
      this.drives = resObj.orderItems
      this.pathSep = resObj.pathSep
    },
    onHandleColumsInit () {
      this.mainWrapper = this.$refs.mainWrapper
      this.foldersBox = this.$refs.foldersBox
      this.listBoxHandler = this.$refs.listBoxHandler
    },
    onWindowResize () {
      this.$forceCompute('styleRightSidebarTableWidth')
      this.$forceCompute('styleRightSidebarWidth')
    },
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
      this.leftSidebarWidth = (Math.max(boxAminWidth, pointerRelativeXpos - 8) + 10)
    },
    clearAllContentItems () {
      this.contents.splice(0, this.contents.length)
    },
    onUpdateActiveFolder (items) {
      if (this.selectedFolder !== this.active[0]) {
        if (items.length > 0) {
          if (items[0] === 'ROOT') {
            this.clearAllContentItems()
            this.contents.push(...this.drives)
          } else {
            this.selectedFolder = items[0] + this.pathSep
            this.clearAllContentItems()
            const res = window.ipcRenderer.sendSync('req_folderContents', this.selectedFolder)
            const newContents = JSON.parse(res)
            this.contents.push(...newContents)
          }
        }
      }
    },
    onSelectedFolder (node) {
      const res = window.ipcRenderer.sendSync('req_folders', node)
      const resObj = JSON.parse(res)
      if (node.children.length) {
        node.children.splice(0, node.children.length)
      }
      node.children.push(...resObj)
    }

  }
}
</script>

<style lang="scss" scope>

.main-wrapper {
  position: relative;
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
  .list-box-handler::before {
      content: '';
      display: block;
      width: 5px;
      height: 100%;
      background: #999;
      margin: 0 auto;
    }

  .folders-box {
    overflow-y: scroll;
    display: flex;
    height: 100%;
    min-height: 100%;
    position: relative;
  }

  .files-box {
    padding: 10px;
    overflow: scroll;
    flex-flow: row wrap;
    height: 100%;
    min-height: 100%;
    width: 100%;

    .file-box-table {
      font-size: 0.9rem;
      border-top: 1px solid #ccc;

      th {
        text-align: left;
        padding: 5px;
      }
      .th-1 {
        border-right: 1px solid #ccc;
      }
      .th-2 {
        width: 60px;
        border-right: 1px solid #ccc;
      }
      .th-3 {
        width: 130px;
        border-right: 1px solid #ccc;
      }
      td {
        padding-left: 5px;
        padding-right: 5px;
        padding-bottom: 5px;

        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }
    }
  }

  .folder-label-text{
    font-size: 0.9rem;
  }

  .v-treeview-node__root {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
  }
}
</style>
