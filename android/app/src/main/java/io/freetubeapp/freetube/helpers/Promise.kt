package io.freetubeapp.freetube.helpers

import org.json.JSONObject
import java.util.concurrent.BlockingQueue
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit

class Promise<T>(given: ((T) -> Unit, (JSONObject) -> Unit) -> Unit) {
  companion object {
    private val NUMBER_OF_CORES = Runtime.getRuntime().availableProcessors()

    // Instantiates the queue of Runnables as a LinkedBlockingQueue
    private val workQueue: BlockingQueue<Runnable> = LinkedBlockingQueue()

    // Sets the amount of time an idle thread waits before terminating
    private val KEEP_ALIVE_TIME = 1

    // Sets the Time Unit to seconds
    private val KEEP_ALIVE_TIME_UNIT: TimeUnit = TimeUnit.SECONDS

    // Creates a thread pool manager
    private var threadPoolExecutor = ThreadPoolExecutor(
      NUMBER_OF_CORES,  // Initial pool size
      NUMBER_OF_CORES,  // Max pool size
      KEEP_ALIVE_TIME.toLong(),
      KEEP_ALIVE_TIME_UNIT,
      workQueue
    )
  }

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
    threadPoolExecutor.execute {
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
