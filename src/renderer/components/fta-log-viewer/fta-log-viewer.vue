<template>
  <div v-if="usingAndroid && !usingRelease">
    <ft-prompt
      v-if="shown"
      class="prompt"
      :label="$t('Log Viewer.Console Log')"
      :inert="hidden"
      :fullscreen="true"
      @click="hideLogViewer"
    >
      <div
        class="logs-wrapper"
        :data-theme="theme"
      >
        <h2>
          {{ $t('Log Viewer.Console Log') }}
        </h2>
        <div class="logs">
          <div
            v-for="log in logsReversed"
            :key="log.key"
            :class="log.level.toLowerCase()"
          >
            <font-awesome-icon
              v-if="getFaIconFromLevel(log.level) !== null"
              class="level"
              :icon="['fas', getFaIconFromLevel(log.level)]"
            />
            <span
              class="content"
              v-html="log.content"
            />
            <span class="source">{{ `${removeQueryString(log.sourceId)}:${log.lineNumber}` }}</span>
            <span class="timestamp">{{ new Date(log.timestamp).toISOString() }}</span>
          </div>
        </div>
        <div class="actions-container">
          <ft-flex-box>
            <ft-button
              :label="$t('Close')"
              :text-color="null"
              :background-color="null"
              @click="hideLogViewer"
            />
          </ft-flex-box>
        </div>
      </div>
    </ft-prompt>
  </div>
</template>

<script src="./fta-log-viewer.js" />
<style scoped src="./fta-log-viewer.css" />
