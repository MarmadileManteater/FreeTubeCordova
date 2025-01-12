package io.freetubeapp.freetube.helpers

import org.json.JSONObject

class Promise<T>(given: ((T) -> Unit, (JSONObject) -> Unit) -> Unit) {
  private val successListeners: MutableList<(T) -> Unit> = mutableListOf()
  private val failureListeners: MutableList<(JSONObject) -> Unit> = mutableListOf()
  var result: T? = null
  var error: JSONObject? = null

  private fun notifySuccess(result: T) {
    for (listener in successListeners) {
      listener.invoke(result)
    }
  }

  private fun notifyFailure(result: JSONObject) {
    for (listener in failureListeners) {
      listener.invoke(result)
    }
  }

  init {
    EasyThreadPoolExecutor.threadPoolExecutor.execute {
      given({ result ->
        notifySuccess(result)
      }) { result ->
        notifyFailure(result)
      }
    }
  }

  fun then(listener: (T) -> Unit): Promise<T> {
    if (result != null) {
      listener(result!!)
    } else {
      successListeners.add(listener)
    }
    return this
  }

  fun catch(listener: (JSONObject) -> Unit): Promise<T> {
    if (error != null) {
      listener(error!!)
    } else {
      failureListeners.add(listener)
    }
    return this
  }
}
