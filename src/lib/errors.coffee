class ShutdownError extends Error
  constructor: () ->
    super "Going into shutdown."


module.exports =
  ShutdownError: ShutdownError
