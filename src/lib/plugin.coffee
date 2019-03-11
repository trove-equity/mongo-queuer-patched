_          = require 'lodash'

mongoose   = require 'mongoose'
Schema     = mongoose.Schema

# Schemas
# @TODO: Polling

LogSchema = new Schema {
  timestamp:
    required: true
    type:     Date
  log:
    required: true
    type:     Schema.Types.Mixed
}

# Plugin
PluginFn = (schema, { taskFn, timeout = null } = {}) ->
  throw new Error("'taskFn' parameter must be provided to MongoQueuer.TaskPlugin constructor") unless taskFn?

  schema.statics._mongoQueuerOptions =
    taskFn:  taskFn
    timeout: timeout

  schema.add
    status:
      required: true
      type:     String
      enum:     [ 'QUEUED', 'EXECUTING', 'FAILED', 'SUCCESS' ]
    substatus:
      required: false
      default:  null
      type:     String
      enum:     [ 'FAILED_ERR', 'FAILED_TIMEOUT', null ]
    error:
      required: false
      default:  null
      type:     Schema.Types.Mixed
    result:
      required: false
      default:  null
      type:     Schema.Types.Mixed
    status_change_at:
      required: true
      type:     Date
    timeout_at:
      required: false
      default:  null
      type:     Date
    status_history:
      default:  []
      type:     [ Schema.Types.Mixed ]
    logs:
      default:  []
      type:     [ LogSchema ]

  # Indexes
  schema.index {
    status: 1
    timeout_at: 1
  }

  # Helpers
  schema.statics._updateStatusKwargs = (status, substatus, { updateKwargs={}, isInsert=false } = {}) ->
    commonKwargs = _.assign {
      status:           status
      substatus:        substatus
      status_change_at: new Date()
    }, updateKwargs

    kwargs = _.clone commonKwargs

    if isInsert
      kwargs['status_history'] = commonKwargs
    else
      kwargs['$push'] = { status_history: commonKwargs }

    return kwargs

  # Create
  schema.statics.createTask = (taskKwargs, done) ->
    defaultKwargs = @_updateStatusKwargs 'QUEUED', null, isInsert: true

    kwargs =
      _.chain taskKwargs
        .omit (k) -> k in ["status", "substatus", "error", "result", "status_change_at", "timeout_at", "status_history", "logs"]
        .defaults defaultKwargs
        .value()

    task = new @(kwargs)
    task.save (err, task, numAffected) ->
      done err, task

  # Logging
  schema.methods.addLog = (logKwargs) ->
    Model = @constructor

    query        = { _id: @_id }
    opts         = { upsert: true }

    subDocKwargs =
      timestamp: new Date()
      log:       logKwargs

    kwargs       = { $push: { logs: subDocKwargs } }

    # Log is not considered to be mission-critical, no callback.
    Model.update(query, kwargs, opts).exec()

  schema.methods.retry = (done) ->
    Model = @constructor

    unless @status in [ 'FAILED', 'SUCCESS' ]
      return done new Error("Improper status for retry: <#{@status}>")

    @_updateStatus 'QUEUED', null, null, done

  # Update
  schema.methods._updateStatus = (status, substatus, resultObject={}, done) ->
    Model = @constructor

    query = { _id: @_id, status_change_at: @status_change_at }

    kwargs = Model._updateStatusKwargs status, substatus, {
      updateKwargs:
        result: resultObject.result?.toJSON?() ? resultObject?.result ? null
        error:  resultObject.error?.toJSON?() ? resultObject?.error ? null
    }

    opts  = { new: true }

    Model.findOneAndUpdate query, kwargs, opts, (err, updatedObject) ->
      return done err if err?
      return done new Error("Task no longer owned by caller.") unless updatedObject?

      done null, updatedObject

  # Fetch
  schema.statics._dequeueOne = (done) ->
    query  = { status: 'QUEUED' }

    updateKwargs = {}
    if timeout
      updateKwargs.timeout_at = new Date(Date.now() + timeout)

    kwargs = @_updateStatusKwargs 'EXECUTING', null, { updateKwargs: updateKwargs }

    # Can't use multi, because it's not atomic.
    opts   = { new: true }

    @findOneAndUpdate query, kwargs, opts, done

  schema.statics._failTimedOutOne = (done) ->
    query  = { status: 'EXECUTING', timeout_at: { $lt: new Date() } }
    kwargs = @_updateStatusKwargs 'FAILED', 'FAILED_TIMEOUT'

    # Can't use multi, because it's not atomic.
    opts   = { new: true }

    @findOneAndUpdate query, kwargs, opts, done


module.exports = PluginFn
