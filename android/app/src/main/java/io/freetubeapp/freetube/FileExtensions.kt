package io.freetubeapp.freetube

import io.freetubeapp.freetube.helpers.Promise
import io.freetubeapp.freetube.helpers.toJSON
import java.io.File
import java.io.FileInputStream


fun File.readText() : Promise<String> {
  return Promise {
      resolve,
      reject ->
    try {
      resolve(FileInputStream(this@readText).bufferedReader().use { it.readText() })
    } catch (ex: Exception) {
      reject(ex.toJSON())
    }
  }
}

enum class WriteMode {
  Truncate,
  Append
}

fun File.writeText(content: String, mode: WriteMode = WriteMode.Truncate) : Promise<Unit?> {
  return Promise {
      resolve,
      reject ->
    try {
      if (!exists()) {
        createNewFile()
      }
      if (mode == WriteMode.Truncate) {
        writeText(content)
      }
      if (mode == WriteMode.Append) {
        appendText(content)
      }
      resolve(null)
    } catch (ex: Exception) {
      reject(ex.toJSON())
    }
  }
}
