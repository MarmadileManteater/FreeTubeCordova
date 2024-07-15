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
        <div class="queue">
          <div
            v-for="queueItem in queueReversed"
            :key="queueItem.videoData.id"
            class="queueItem"
          >
            <img
              class="thumbnail"
              :src="queueItem.videoData.thumbnail"
              :alt="queueItem.videoData.title"
            >
            <div class="meta">
              <div class="title">
                {{ queueItem.videoData.title }}
              </div>
              <div class="date-added">
                {{ getRelativeTimeFromDate(new Date(queueItem.timestamp)) }}
              </div>
            </div>
          </div>
        </div>
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
