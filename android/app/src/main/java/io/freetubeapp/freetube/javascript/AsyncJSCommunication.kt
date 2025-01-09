package io.freetubeapp.freetube.javascript

import android.webkit.WebView
import java.util.UUID.randomUUID

class AsyncJSCommunication(givenWebView: WebView) {
  private val webView = givenWebView
  private var syncMessages: MutableMap<String, String> = HashMap()

  /**
   * @return the id of a promise on the window
   */
  fun jsPromise(): String {
    return "${randomUUID()}"
  }

  /**
   * resolves a js promise given the id
   */
  fun resolve(id: String, message: String) {
    syncMessages[id] = message
    webView.dispatchEvent("$id-resolve")
  }

  /**
   * rejects a js promise given the id
   */
  fun reject(id: String, message: String) {
    syncMessages[id] = message
    webView.dispatchEvent("$id-reject")
  }

  fun getSyncMessage(promise: String): String {
    val value = syncMessages[promise]
    syncMessages.remove(promise)
    return value!!
  }
}
