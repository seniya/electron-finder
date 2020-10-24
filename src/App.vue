<template>
  <!--<mainComponent></mainComponent> -->
  <!-- -->
  <v-app style="height: 100%; min-height: 100%;">
    <v-main  style="height: 100%; min-height: 100%;">
      <mainComponent></mainComponent>
    </v-main>
  </v-app>
</template>

<script>
// import walkFolders from '@/util/walkFolders'
// import getWindowsDrives from '@/util/getWindowsDrives'

// const fs = require('fs')
// const path = require('path')

// console.log(walkFolders)
import mainComponent from '@/views/mainComponent.vue'

export default {
  name: 'App',

  components: {
    mainComponent
  },

  data: () => ({
  }),

  mounted () {
    // this.getWindowsDrives_()
    // console.log('aaa')

  },

  methods: {

    // getWindowsDrives_ () {
    //   getWindowsDrives(this.platform, (error, drives) => {
    //     if (!error) {
    //       this.drives = drives
    //       // work through the drives backwards
    //       for (let index = this.drives.length - 1; index >= 0; --index) {
    //         try {
    //           const stat = fs.statSync(this.drives[index] + path.sep)
    //           const fileInfo = {}
    //           fileInfo.rootDir = this.drives[index]
    //           fileInfo.fileName = path.sep
    //           fileInfo.isDir = stat.isDirectory()
    //           fileInfo.stat = stat
    //           const node = this.createNode(fileInfo)
    //           this.rootDir.unshift(node)
    //         } catch (error) {
    //           // remove from (bad/phantom) drive list
    //           this.drives.splice(index, 1)
    //           console.error(error)
    //         }
    //       }
    //     }
    //   })
    // }

  }
}
</script>

<style>
html, body {
  height: 100%;
  min-height: 100%;
}
</style>
