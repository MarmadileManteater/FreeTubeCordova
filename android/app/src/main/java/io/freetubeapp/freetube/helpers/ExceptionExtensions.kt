package io.freetubeapp.freetube.helpers

import org.json.JSONObject


fun Exception.toJSON() : JSONObject {
  val json = JSONObject()
  json.put("stackTrace", this.stackTraceToString())
  json.put("message", this.message)
  json.put("cause", this.cause)
  return json
}
