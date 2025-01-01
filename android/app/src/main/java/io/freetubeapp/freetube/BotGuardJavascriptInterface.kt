package io.freetubeapp.freetube

import android.media.session.PlaybackState
import android.webkit.JavascriptInterface
import androidx.activity.result.ActivityResult

class BotGuardJavascriptInterface(main: MainActivity) {
  private var poToken: String? = null
  private var context: MainActivity = main
  private var tokenListeners: MutableList<(String) -> Unit> = mutableListOf()

  @JavascriptInterface
  fun returnToken(token: String) {
    notify(token)
    poToken = token
  }

  fun notify(token: String) {
     tokenListeners.forEach {
       it(token)
     }
    tokenListeners = mutableListOf()
  }

  fun onReturnToken(callback: (String) -> Unit) {
    if (poToken != null) {
      callback(poToken!!)
    } else {
      tokenListeners.add(callback)
    }
  }
}
