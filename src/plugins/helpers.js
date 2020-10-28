import Vue from 'vue'
import { getFileIcon, getFileSizeIEC, getFileType, getFileTime } from '@/util/common'

const plugin = {
  install (Vue, options) {
    Vue.prototype.$getFileIcon = getFileIcon
    Vue.prototype.$getFileSizeIEC = getFileSizeIEC
    Vue.prototype.$getFileType = getFileType
    Vue.prototype.$getFileTime = getFileTime
  }
}

Vue.use(plugin)
