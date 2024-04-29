<template>
  <portal>
    <div
      ref="wrapper"
      class="dialog-wrapper"
      tabindex="0"
      @click="onWrapperClick"
      @keydown="keydown"
    >
      <dialog
        ref="dialog"
        :open="shown"
      >
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
        <div class="br">
          &nbsp;
        </div>
        <ft-input
          :label="'File name'"
          :show-label="true"
          :placeholder="placeholderTitle"
          :show-action-button="false"
        />
        <div class="br">
          &nbsp;
        </div>
        <div class="buttons">
          <!-- using user playlists strings here is a dirty trick -->
          <!-- however, one tangible benefit is that upstream actually gets translations -->
          <ft-button
            :label="$t('User Playlists.AddVideoPrompt.Save')"
            @click="addToDownload"
          />
          <ft-button
            :label="$t('User Playlists.Cancel')"
            @click="hide"
          />
        </div>
      </dialog>
    </div>
  </portal>
</template>
<script src="./fta-add-download-prompt.js"></script>
<style src="./fta-add-download-prompt.css"></style>
