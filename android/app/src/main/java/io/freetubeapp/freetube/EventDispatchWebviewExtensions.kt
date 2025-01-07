package io.freetubeapp.freetube

import android.webkit.WebView
import org.json.JSONObject
import java.nio.charset.StandardCharsets

fun WebView.fafJS(js: String) {
  post {
    loadUrl("javascript: $js")
  }
}

fun WebView.dispatchEvent(eventName: String) {
  fafJS("window.dispatchEvent(new Event(\"$eventName\"))")
}

fun WebView.dispatchEvent(eventName: String, event: JSONObject) {
  var js = "var tempVar = new Event(\"$eventName\");"
  js += "Object.assign(tempVar, $event);"
  js += "window.dispatchEvent(tempVar);"
  fafJS(js)
}

fun WebView.dispatchEvent(eventName: String, keyName: String, data: String) {
  val wrapper = JSONObject()
  wrapper.put(keyName, data)
  dispatchEvent(eventName, wrapper)
}

fun WebView.dispatchEvent(eventName: String, keyName: String, data: Long) {
  val wrapper = JSONObject()
  wrapper.put(keyName, data)
  dispatchEvent(eventName, wrapper)
}

fun WebView.dispatchEvent(eventName: String, keyName: String, data: JSONObject) {
  val wrapper = JSONObject()
  wrapper.put(keyName, data)
  dispatchEvent(eventName, wrapper)
}

/**
 * encodes a string message for transport across the java bridge
 * @param message the message to be encoded
 */
fun btoa(message: String): String {
  return "atob(\"${String(
    android.util.Base64.encode(message.toByteArray(), android.util.Base64.DEFAULT),
    StandardCharsets.UTF_8
  )}\")"
}

/**
 * @param message the message to log
 * @param level used in js as "console.$level" (ex: log, warn, error)
 */
fun WebView.consoleLog(message: String, level: String = "log") {
  fafJS("console.$level(${btoa(message)})")
}

fun WebView.consoleError(message: String) {
  consoleLog(message, "error")
}

fun WebView.consoleWarn(message: String) {
  consoleLog(message, "warn")
}
