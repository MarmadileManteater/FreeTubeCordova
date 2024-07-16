<template>
  <ft-prompt
    v-if="shown"
    :class-list="['download-prompt']"
    :fullscreen="true"
    :label="$t('Download Manager.Download Manager')"
    @click="hideDownloadManager"
  >
    <div class="wrapper">
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
            <div
              :class="['stage', queueItem.stage]"
            >
              {{ $t(`Download Manager.Download Stages.${queueItem.stage}`) }}
            </div>
            <div class="title">
              {{ queueItem.videoData.title }}
            </div>
            <div class="date-added">
              {{ getRelativeTimeFromDate(new Date(queueItem.timestamp)) }}
            </div>
          </div>
        </div>
      </div>
      <div class="buttons download-manager-buttons">
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
<style src="./fta-download-manager.css" />
