async = require('async')

EventEmitter = require('events').EventEmitter

QueuerErrors = require('./errors')


# @TODO: Wrap in domains
class Worker extends EventEmitter
  constructor: (@Model, { @concurrency = 1, @pollInterval = 500 } = {}) ->
    throw new Error("'Model' must be passed to MongoQueuer.Worker constructor") unless @Model?
    throw new Error("'Model' must use the MongoQueuer.TaskPlugin") unless @Model._mongoQueuerOptions?

    # Internal state
    @queue = async.queue @executeTask, @concurrency
    @isShuttingDown = false

  # Error notifications
  notifyError: (err) ->
    if err instanceof QueuerErrors.ShutdownError
      console.log 'Process gone into shutdown mode. Not polling anymore.'
    else
      console.log err
      @emit 'error', err

  # Shutdown
  shutdown: (done) ->
    return if @isShuttingDown

    _cleanedUpFn = () =>
      console.log 'Worker quitting'
      @emit 'quit'

      done()

    # @TODO: graceful shutdown timer.
    @queue.concurrency = 0
    @isShuttingDown    = true

    # Callback after finishing all the items.
    if @queue.idle()
      return _cleanedUpFn()

    @queue.drain = _cleanedUpFn

  # Execute one task
  executeTask: (task, done) =>
    # @TODO: Wrap everything in domains and handle exceptions properly.
    @Model._mongoQueuerOptions.taskFn task, (taskErr, result) =>
      _didHandleTaskFn = (err, task) =>
        @notifyError err if err?
        unless task?
          @notifyError 'Task was claimed by a different owner, status update did not succeed.'

        done()

      if taskErr?
        task._updateStatus 'FAILED', 'FAILED_ERR', { error: taskErr }, _didHandleTaskFn
      else
        task._updateStatus 'SUCCESS', null, { result: result }, _didHandleTaskFn

  # Polling control
  setPollingCallback: (cb) =>
    @_pollDelayedCallback = cb

  executePollingCallback: (err) =>
    clearTimeout @pollTimer if @pollTimer?
    @pollTimer = null

    throw new Error "@_pollDelayedCallback not set, critical error, should never have happened!" unless @_pollDelayedCallback?

    fn = @_pollDelayedCallback
    @setPollingCallback null
    fn(err)

  pollAgainInSomeTime: () =>
    return if @pollTimer?
    @pollTimer = setTimeout @executePollingCallback, @pollInterval

  pollNow: () =>
    @executePollingCallback()

  # Fetch tasks
  run: () ->
    pendingDequeues = 0

    async.forever (done) =>
      @setPollingCallback done

      return @executePollingCallback new QueuerErrors.ShutdownError() if @isShuttingDown

      if @queue.length() + @queue.running() + pendingDequeues >= @queue.concurrency
        return @pollAgainInSomeTime()

      pendingDequeues += 1
      @Model._dequeueOne (err, object) =>
        pendingDequeues -= 1

        if err?
          @notifyError err
          return @pollAgainInSomeTime()

        unless object?
          return @pollAgainInSomeTime()

        @queue.push object, () => @pollNow()
        @pollNow()
    , (err) =>
      @notifyError err
      @_quit()


module.exports = Worker
