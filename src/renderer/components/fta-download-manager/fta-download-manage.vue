<template>
  <ft-prompt
    v-if="shown"
    :class-list="['download-prompt']"
    :fullscreen="true"
    :label="$t('Download Manager.Download Manager')"
    @click="hideDownloadManager"
  >
    <div class="wrapper">
      <ft-flex-box>
        <h2 class="heading">
          {{ $t('Download Manager.Download Manager') }}
        </h2>
      </ft-flex-box>
      <div class="buttons">
        <ft-button
          :label="$t('Close')"
          :text-color="null"
          :background-color="null"
          @click="hideDownloadManager"
        />
      </div>
    </div>
  </ft-prompt>
</template>

<script src="./fta-download-manager.js" />
<style scoped src="./fta-download-manager.css" />
