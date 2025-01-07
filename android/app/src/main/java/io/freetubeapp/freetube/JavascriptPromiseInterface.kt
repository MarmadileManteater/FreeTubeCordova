package io.freetubeapp.freetube

import android.webkit.JavascriptInterface
import android.webkit.WebView
import java.util.UUID.randomUUID

open class JavascriptPromiseInterface(givenWebView: WebView) {
  protected val webView = givenWebView
  protected var syncMessages: MutableMap<String, String> = HashMap()

  /**
   * @return the id of a promise on the window
   */
  protected fun jsPromise(): String {
    val id = "${randomUUID()}"
    webView.fafJS("window['${id}'] = {}; window['${id}'].promise = new Promise((resolve, reject) => { window['${id}'].resolve = resolve; window['${id}'].reject = reject })")
    return id
  }

  /**
   * resolves a js promise given the id
   */
  protected fun resolve(id: String, message: String) {
    syncMessages[id] = message
    webView.fafJS("window['${id}'].resolve()")
  }

  /**
   * rejects a js promise given the id
   */
  protected fun reject(id: String, message: String) {
    syncMessages[id] = message
    webView.fafJS("window['${id}'].reject(new Error())")
  }
}
