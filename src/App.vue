<template>
  <v-app style="height: 100%; min-height: 100%;">
    <v-main  style="height: 100%; min-height: 100%;">
      <mainComponent></mainComponent>
    </v-main>
  </v-app>
</template>

<script>
import mainComponent from '@/views/mainComponent.vue'

export default {
  name: 'App',
  components: {
    mainComponent
  }
}
</script>

<style>
html, body {
  height: 100%;
  min-height: 100%;
  overflow: hidden;
}
</style>
