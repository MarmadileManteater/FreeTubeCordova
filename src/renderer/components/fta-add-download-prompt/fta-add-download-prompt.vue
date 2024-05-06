<template>
  <ft-prompt
    v-if="shown"
    :class-list="['download-prompt']"
    :fullscreen="true"
    :label="$t('Download Prompt.Download')"
    @click="hide()"
  >
    <div class="wrapper">
      <ft-flex-box>
        <h2 class="heading">
          {{ $t('Download Prompt.Download') }}
        </h2>
        <ft-select
          :placeholder="$t('Download Prompt.Formats')"
          :value="formatSelected"
          :select-names="sourceNames"
          :select-values="sourceIds"
          :icon="['fas', 'download']"
          @change="updateFormatSelected"
        />
        <ft-input
          :label="'File name'"
          :show-label="true"
          :placeholder="placeholderTitle"
          :show-action-button="false"
        />
      </ft-flex-box>
      <div class="buttons">
        <!-- using user playlists strings here is a dirty trick -->
        <!-- however, one tangible benefit is that upstream actually gets translations -->
        <ft-button
          :label="$t('User Playlists.AddVideoPrompt.Save')"
          @click="addToDownload"
        />
        <ft-button
          :label="$t('User Playlists.Cancel')"
          :text-color="null"
          :background-color="null"
          @click="hide"
        />
      </div>
    </div>
  </ft-prompt>
</template>
<script src="./fta-add-download-prompt.js"></script>
<style scoped src="./fta-add-download-prompt.css"></style>
