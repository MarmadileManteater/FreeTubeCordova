<template>
  <portal>
    <div
      ref="wrapper"
      class="dialog-wrapper"
      @click="onWrapperClick"
      @keydown="keydown"
      tabindex="0"
    >
      <dialog
        ref="dialog"
        :open="shown"
      >
        <h2 class="heading">
          {{ $t('Download Prompt.Download') }}
        </h2>
      </dialog>
    </div>
  </portal>
</template>
<script src="./fta-add-download-prompt.js"></script>
<style src="./fta-add-download-prompt.css"></style>
