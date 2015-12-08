var EventEmitter, QueuerErrors, Worker, async,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

async = require('async');

EventEmitter = require('events').EventEmitter;

QueuerErrors = require('./errors');

Worker = (function(superClass) {
  extend(Worker, superClass);

  function Worker(Model, arg) {
    var ref, ref1, ref2;
    this.Model = Model;
    ref = arg != null ? arg : {}, this.concurrency = (ref1 = ref.concurrency) != null ? ref1 : 1, this.pollInterval = (ref2 = ref.pollInterval) != null ? ref2 : 500;
    this.pollNow = bind(this.pollNow, this);
    this.pollAgainInSomeTime = bind(this.pollAgainInSomeTime, this);
    this.executePollingCallback = bind(this.executePollingCallback, this);
    this.setPollingCallback = bind(this.setPollingCallback, this);
    this.executeTask = bind(this.executeTask, this);
    if (this.Model == null) {
      throw new Error("'Model' must be passed to MongoQueuer.Worker constructor");
    }
    if (this.Model._mongoQueuerOptions == null) {
      throw new Error("'Model' must use the MongoQueuer.TaskPlugin");
    }
    this.queue = async.queue(this.executeTask, this.concurrency);
    this.isShuttingDown = false;
  }

  Worker.prototype.notifyError = function(err) {
    if (err instanceof QueuerErrors.ShutdownError) {
      return console.log('Process gone into shutdown mode. Not polling anymore.');
    } else {
      console.log(err);
      return this.emit('error', err);
    }
  };

  Worker.prototype.shutdown = function(done) {
    var _cleanedUpFn;
    if (this.isShuttingDown) {
      return;
    }
    _cleanedUpFn = (function(_this) {
      return function() {
        console.log('Worker quitting');
        _this.emit('quit');
        return done();
      };
    })(this);
    this.queue.concurrency = 0;
    this.isShuttingDown = true;
    if (this.queue.idle()) {
      return _cleanedUpFn();
    }
    return this.queue.drain = _cleanedUpFn;
  };

  Worker.prototype.executeTask = function(task, done) {
    return this.Model._mongoQueuerOptions.taskFn(task, (function(_this) {
      return function(taskErr, result) {
        var _didHandleTaskFn;
        _didHandleTaskFn = function(err, task) {
          if (err != null) {
            _this.notifyError(err);
          }
          if (task == null) {
            _this.notifyError('Task was claimed by a different owner, status update did not succeed.');
          }
          return done();
        };
        if (taskErr != null) {
          return task._updateStatus('FAILED', 'FAILED_ERR', {
            error: taskErr
          }, _didHandleTaskFn);
        } else {
          return task._updateStatus('SUCCESS', null, {
            result: result
          }, _didHandleTaskFn);
        }
      };
    })(this));
  };

  Worker.prototype.setPollingCallback = function(cb) {
    return this._pollDelayedCallback = cb;
  };

  Worker.prototype.executePollingCallback = function(err) {
    var fn;
    if (this.pollTimer != null) {
      clearTimeout(this.pollTimer);
    }
    this.pollTimer = null;
    if (this._pollDelayedCallback == null) {
      throw new Error("@_pollDelayedCallback not set, critical error, should never have happened!");
    }
    fn = this._pollDelayedCallback;
    this.setPollingCallback(null);
    return fn(err);
  };

  Worker.prototype.pollAgainInSomeTime = function() {
    if (this.pollTimer != null) {
      return;
    }
    return this.pollTimer = setTimeout(this.executePollingCallback, this.pollInterval);
  };

  Worker.prototype.pollNow = function() {
    return this.executePollingCallback();
  };

  Worker.prototype.run = function() {
    var pendingDequeues;
    pendingDequeues = 0;
    return async.forever((function(_this) {
      return function(done) {
        _this.setPollingCallback(done);
        if (_this.isShuttingDown) {
          return _this.executePollingCallback(new QueuerErrors.ShutdownError());
        }
        if (_this.queue.length() + _this.queue.running() + pendingDequeues >= _this.queue.concurrency) {
          return _this.pollAgainInSomeTime();
        }
        pendingDequeues += 1;
        return _this.Model._dequeueOne(function(err, object) {
          pendingDequeues -= 1;
          if (err != null) {
            _this.notifyError(err);
            return _this.pollAgainInSomeTime();
          }
          if (object == null) {
            return _this.pollAgainInSomeTime();
          }
          _this.queue.push(object, function() {
            return _this.pollNow();
          });
          return _this.pollNow();
        });
      };
    })(this), (function(_this) {
      return function(err) {
        _this.notifyError(err);
        return _this._quit();
      };
    })(this));
  };

  return Worker;

})(EventEmitter);

module.exports = Worker;

//# sourceMappingURL=data:application/json;base64,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bUI7VUFFbkIsSUFBRyxXQUFIO1lBQ0UsS0FBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiO0FBQ0EsbUJBQU8sS0FBQyxDQUFBLG1CQUFELENBQUEsRUFGVDs7VUFJQSxJQUFPLGNBQVA7QUFDRSxtQkFBTyxLQUFDLENBQUEsbUJBQUQsQ0FBQSxFQURUOztVQUdBLEtBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFZLE1BQVosRUFBb0IsU0FBQTttQkFBTSxLQUFDLENBQUEsT0FBRCxDQUFBO1VBQU4sQ0FBcEI7aUJBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBQTtRQVhpQixDQUFuQjtNQVRZO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFkLEVBcUJFLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQyxHQUFEO1FBQ0EsS0FBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiO2VBQ0EsS0FBQyxDQUFBLEtBQUQsQ0FBQTtNQUZBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXJCRjtFQUhHOzs7O0dBM0VjOztBQXdHckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJmaWxlIjoibGliL3dvcmtlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbImFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKVxuXG5FdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcblxuUXVldWVyRXJyb3JzID0gcmVxdWlyZSgnLi9lcnJvcnMnKVxuXG5cbiMgQFRPRE86IFdyYXAgaW4gZG9tYWluc1xuY2xhc3MgV29ya2VyIGV4dGVuZHMgRXZlbnRFbWl0dGVyXG4gIGNvbnN0cnVjdG9yOiAoQE1vZGVsLCB7IEBjb25jdXJyZW5jeSA9IDEsIEBwb2xsSW50ZXJ2YWwgPSA1MDAgfSA9IHt9KSAtPlxuICAgIHRocm93IG5ldyBFcnJvcihcIidNb2RlbCcgbXVzdCBiZSBwYXNzZWQgdG8gTW9uZ29RdWV1ZXIuV29ya2VyIGNvbnN0cnVjdG9yXCIpIHVubGVzcyBATW9kZWw/XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiJ01vZGVsJyBtdXN0IHVzZSB0aGUgTW9uZ29RdWV1ZXIuVGFza1BsdWdpblwiKSB1bmxlc3MgQE1vZGVsLl9tb25nb1F1ZXVlck9wdGlvbnM/XG5cbiAgICAjIEludGVybmFsIHN0YXRlXG4gICAgQHF1ZXVlID0gYXN5bmMucXVldWUgQGV4ZWN1dGVUYXNrLCBAY29uY3VycmVuY3lcbiAgICBAaXNTaHV0dGluZ0Rvd24gPSBmYWxzZVxuXG4gICMgRXJyb3Igbm90aWZpY2F0aW9uc1xuICBub3RpZnlFcnJvcjogKGVycikgLT5cbiAgICBpZiBlcnIgaW5zdGFuY2VvZiBRdWV1ZXJFcnJvcnMuU2h1dGRvd25FcnJvclxuICAgICAgY29uc29sZS5sb2cgJ1Byb2Nlc3MgZ29uZSBpbnRvIHNodXRkb3duIG1vZGUuIE5vdCBwb2xsaW5nIGFueW1vcmUuJ1xuICAgIGVsc2VcbiAgICAgIGNvbnNvbGUubG9nIGVyclxuICAgICAgQGVtaXQgJ2Vycm9yJywgZXJyXG5cbiAgIyBTaHV0ZG93blxuICBzaHV0ZG93bjogKGRvbmUpIC0+XG4gICAgcmV0dXJuIGlmIEBpc1NodXR0aW5nRG93blxuXG4gICAgX2NsZWFuZWRVcEZuID0gKCkgPT5cbiAgICAgIGNvbnNvbGUubG9nICdXb3JrZXIgcXVpdHRpbmcnXG4gICAgICBAZW1pdCAncXVpdCdcblxuICAgICAgZG9uZSgpXG5cbiAgICAjIEBUT0RPOiBncmFjZWZ1bCBzaHV0ZG93biB0aW1lci5cbiAgICBAcXVldWUuY29uY3VycmVuY3kgPSAwXG4gICAgQGlzU2h1dHRpbmdEb3duICAgID0gdHJ1ZVxuXG4gICAgIyBDYWxsYmFjayBhZnRlciBmaW5pc2hpbmcgYWxsIHRoZSBpdGVtcy5cbiAgICBpZiBAcXVldWUuaWRsZSgpXG4gICAgICByZXR1cm4gX2NsZWFuZWRVcEZuKClcblxuICAgIEBxdWV1ZS5kcmFpbiA9IF9jbGVhbmVkVXBGblxuXG4gICMgRXhlY3V0ZSBvbmUgdGFza1xuICBleGVjdXRlVGFzazogKHRhc2ssIGRvbmUpID0+XG4gICAgIyBAVE9ETzogV3JhcCBldmVyeXRoaW5nIGluIGRvbWFpbnMgYW5kIGhhbmRsZSBleGNlcHRpb25zIHByb3Blcmx5LlxuICAgIEBNb2RlbC5fbW9uZ29RdWV1ZXJPcHRpb25zLnRhc2tGbiB0YXNrLCAodGFza0VyciwgcmVzdWx0KSA9PlxuICAgICAgX2RpZEhhbmRsZVRhc2tGbiA9IChlcnIsIHRhc2spID0+XG4gICAgICAgIEBub3RpZnlFcnJvciBlcnIgaWYgZXJyP1xuICAgICAgICB1bmxlc3MgdGFzaz9cbiAgICAgICAgICBAbm90aWZ5RXJyb3IgJ1Rhc2sgd2FzIGNsYWltZWQgYnkgYSBkaWZmZXJlbnQgb3duZXIsIHN0YXR1cyB1cGRhdGUgZGlkIG5vdCBzdWNjZWVkLidcblxuICAgICAgICBkb25lKClcblxuICAgICAgaWYgdGFza0Vycj9cbiAgICAgICAgdGFzay5fdXBkYXRlU3RhdHVzICdGQUlMRUQnLCAnRkFJTEVEX0VSUicsIHsgZXJyb3I6IHRhc2tFcnIgfSwgX2RpZEhhbmRsZVRhc2tGblxuICAgICAgZWxzZVxuICAgICAgICB0YXNrLl91cGRhdGVTdGF0dXMgJ1NVQ0NFU1MnLCBudWxsLCB7IHJlc3VsdDogcmVzdWx0IH0sIF9kaWRIYW5kbGVUYXNrRm5cblxuICAjIFBvbGxpbmcgY29udHJvbFxuICBzZXRQb2xsaW5nQ2FsbGJhY2s6IChjYikgPT5cbiAgICBAX3BvbGxEZWxheWVkQ2FsbGJhY2sgPSBjYlxuXG4gIGV4ZWN1dGVQb2xsaW5nQ2FsbGJhY2s6IChlcnIpID0+XG4gICAgY2xlYXJUaW1lb3V0IEBwb2xsVGltZXIgaWYgQHBvbGxUaW1lcj9cbiAgICBAcG9sbFRpbWVyID0gbnVsbFxuXG4gICAgdGhyb3cgbmV3IEVycm9yIFwiQF9wb2xsRGVsYXllZENhbGxiYWNrIG5vdCBzZXQsIGNyaXRpY2FsIGVycm9yLCBzaG91bGQgbmV2ZXIgaGF2ZSBoYXBwZW5lZCFcIiB1bmxlc3MgQF9wb2xsRGVsYXllZENhbGxiYWNrP1xuXG4gICAgZm4gPSBAX3BvbGxEZWxheWVkQ2FsbGJhY2tcbiAgICBAc2V0UG9sbGluZ0NhbGxiYWNrIG51bGxcbiAgICBmbihlcnIpXG5cbiAgcG9sbEFnYWluSW5Tb21lVGltZTogKCkgPT5cbiAgICByZXR1cm4gaWYgQHBvbGxUaW1lcj9cbiAgICBAcG9sbFRpbWVyID0gc2V0VGltZW91dCBAZXhlY3V0ZVBvbGxpbmdDYWxsYmFjaywgQHBvbGxJbnRlcnZhbFxuXG4gIHBvbGxOb3c6ICgpID0+XG4gICAgQGV4ZWN1dGVQb2xsaW5nQ2FsbGJhY2soKVxuXG4gICMgRmV0Y2ggdGFza3NcbiAgcnVuOiAoKSAtPlxuICAgIHBlbmRpbmdEZXF1ZXVlcyA9IDBcblxuICAgIGFzeW5jLmZvcmV2ZXIgKGRvbmUpID0+XG4gICAgICBAc2V0UG9sbGluZ0NhbGxiYWNrIGRvbmVcblxuICAgICAgcmV0dXJuIEBleGVjdXRlUG9sbGluZ0NhbGxiYWNrIG5ldyBRdWV1ZXJFcnJvcnMuU2h1dGRvd25FcnJvcigpIGlmIEBpc1NodXR0aW5nRG93blxuXG4gICAgICBpZiBAcXVldWUubGVuZ3RoKCkgKyBAcXVldWUucnVubmluZygpICsgcGVuZGluZ0RlcXVldWVzID49IEBxdWV1ZS5jb25jdXJyZW5jeVxuICAgICAgICByZXR1cm4gQHBvbGxBZ2FpbkluU29tZVRpbWUoKVxuXG4gICAgICBwZW5kaW5nRGVxdWV1ZXMgKz0gMVxuICAgICAgQE1vZGVsLl9kZXF1ZXVlT25lIChlcnIsIG9iamVjdCkgPT5cbiAgICAgICAgcGVuZGluZ0RlcXVldWVzIC09IDFcblxuICAgICAgICBpZiBlcnI/XG4gICAgICAgICAgQG5vdGlmeUVycm9yIGVyclxuICAgICAgICAgIHJldHVybiBAcG9sbEFnYWluSW5Tb21lVGltZSgpXG5cbiAgICAgICAgdW5sZXNzIG9iamVjdD9cbiAgICAgICAgICByZXR1cm4gQHBvbGxBZ2FpbkluU29tZVRpbWUoKVxuXG4gICAgICAgIEBxdWV1ZS5wdXNoIG9iamVjdCwgKCkgPT4gQHBvbGxOb3coKVxuICAgICAgICBAcG9sbE5vdygpXG4gICAgLCAoZXJyKSA9PlxuICAgICAgQG5vdGlmeUVycm9yIGVyclxuICAgICAgQF9xdWl0KClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmtlclxuIl19
