<template>
  <v-app>
    <v-main>
      dddd
    </v-main>
  </v-app>
</template>

<script>
import walkFolders from '@/util/walkFolders'
import getWindowsDrives from '@/util/getWindowsDrives'

const fs = require('fs')
const path = require('path')

console.log(walkFolders)

export default {
  name: 'App',

  data: () => ({
    platform: 'win32',
    drive: 'C:',
    drives: []
  }),

  mounted () {
    // this.getWindowsDrives_()
  },

  methods: {
    getWindowsDrives_ () {
      getWindowsDrives(this.platform, (error, drives) => {
        if (!error) {
          this.drives = drives
          // work through the drives backwards
          for (let index = this.drives.length - 1; index >= 0; --index) {
            try {
              const stat = fs.statSync(this.drives[index] + path.sep)
              const fileInfo = {}
              fileInfo.rootDir = this.drives[index]
              fileInfo.fileName = path.sep
              fileInfo.isDir = stat.isDirectory()
              fileInfo.stat = stat
              const node = this.createNode(fileInfo)
              this.rootDir.unshift(node)
            } catch (error) {
              // remove from (bad/phantom) drive list
              this.drives.splice(index, 1)
              console.error(error)
            }
          }
        }
      })
    }

  }
}
</script>
