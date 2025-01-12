package io.freetubeapp.freetube.helpers

// hush hush now 🤫 ik this is totally gross

import java.util.concurrent.BlockingQueue
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit

class EasyThreadPoolExecutor {
  companion object {
    private val NUMBER_OF_CORES = Runtime.getRuntime().availableProcessors()

    // Instantiates the queue of Runnables as a LinkedBlockingQueue
    private val workQueue: BlockingQueue<Runnable> = LinkedBlockingQueue()

    // Sets the amount of time an idle thread waits before terminating
    private val KEEP_ALIVE_TIME = 1

    // Sets the Time Unit to seconds
    private val KEEP_ALIVE_TIME_UNIT: TimeUnit = TimeUnit.SECONDS

    // Creates a thread pool manager
    var threadPoolExecutor = ThreadPoolExecutor(
      NUMBER_OF_CORES,  // Initial pool size
      NUMBER_OF_CORES,  // Max pool size
      KEEP_ALIVE_TIME.toLong(),
      KEEP_ALIVE_TIME_UNIT,
      workQueue
    )
  }
}
