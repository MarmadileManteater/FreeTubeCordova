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
    val id = "${randomUUID()}"
    webView.fafJS("window['${id}'] = {}; window['${id}'].promise = new Promise((resolve, reject) => { window['${id}'].resolve = resolve; window['${id}'].reject = reject })")
    return id
  }

  /**
   * resolves a js promise given the id
   */
  fun resolve(id: String, message: String) {
    syncMessages[id] = message
    webView.fafJS("window['${id}'].resolve()")
  }

  /**
   * rejects a js promise given the id
   */
  fun reject(id: String, message: String) {
    syncMessages[id] = message
    webView.fafJS("window['${id}'].reject(new Error())")
  }

  fun getSyncMessage(promise: String): String {
    val value = syncMessages[promise]
    syncMessages.remove(promise)
    return value!!
  }
}
