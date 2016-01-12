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
        return _this.notifyError(err);
      };
    })(this));
  };

  return Worker;

})(EventEmitter);

module.exports = Worker;

//# sourceMappingURL=data:application/json;base64,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bUI7VUFFbkIsSUFBRyxXQUFIO1lBQ0UsS0FBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiO0FBQ0EsbUJBQU8sS0FBQyxDQUFBLG1CQUFELENBQUEsRUFGVDs7VUFJQSxJQUFPLGNBQVA7QUFDRSxtQkFBTyxLQUFDLENBQUEsbUJBQUQsQ0FBQSxFQURUOztVQUdBLEtBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFZLE1BQVosRUFBb0IsU0FBQTttQkFBTSxLQUFDLENBQUEsT0FBRCxDQUFBO1VBQU4sQ0FBcEI7aUJBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBQTtRQVhpQixDQUFuQjtNQVRZO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFkLEVBcUJFLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQyxHQUFEO2VBQ0EsS0FBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiO01BREE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBckJGO0VBSEc7Ozs7R0EzRWM7O0FBdUdyQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsImZpbGUiOiJsaWIvd29ya2VyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiYXN5bmMgPSByZXF1aXJlKCdhc3luYycpXG5cbkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlclxuXG5RdWV1ZXJFcnJvcnMgPSByZXF1aXJlKCcuL2Vycm9ycycpXG5cblxuIyBAVE9ETzogV3JhcCBpbiBkb21haW5zXG5jbGFzcyBXb3JrZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAgY29uc3RydWN0b3I6IChATW9kZWwsIHsgQGNvbmN1cnJlbmN5ID0gMSwgQHBvbGxJbnRlcnZhbCA9IDUwMCB9ID0ge30pIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiJ01vZGVsJyBtdXN0IGJlIHBhc3NlZCB0byBNb25nb1F1ZXVlci5Xb3JrZXIgY29uc3RydWN0b3JcIikgdW5sZXNzIEBNb2RlbD9cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCInTW9kZWwnIG11c3QgdXNlIHRoZSBNb25nb1F1ZXVlci5UYXNrUGx1Z2luXCIpIHVubGVzcyBATW9kZWwuX21vbmdvUXVldWVyT3B0aW9ucz9cblxuICAgICMgSW50ZXJuYWwgc3RhdGVcbiAgICBAcXVldWUgPSBhc3luYy5xdWV1ZSBAZXhlY3V0ZVRhc2ssIEBjb25jdXJyZW5jeVxuICAgIEBpc1NodXR0aW5nRG93biA9IGZhbHNlXG5cbiAgIyBFcnJvciBub3RpZmljYXRpb25zXG4gIG5vdGlmeUVycm9yOiAoZXJyKSAtPlxuICAgIGlmIGVyciBpbnN0YW5jZW9mIFF1ZXVlckVycm9ycy5TaHV0ZG93bkVycm9yXG4gICAgICBjb25zb2xlLmxvZyAnUHJvY2VzcyBnb25lIGludG8gc2h1dGRvd24gbW9kZS4gTm90IHBvbGxpbmcgYW55bW9yZS4nXG4gICAgZWxzZVxuICAgICAgY29uc29sZS5sb2cgZXJyXG4gICAgICBAZW1pdCAnZXJyb3InLCBlcnJcblxuICAjIFNodXRkb3duXG4gIHNodXRkb3duOiAoZG9uZSkgLT5cbiAgICByZXR1cm4gaWYgQGlzU2h1dHRpbmdEb3duXG5cbiAgICBfY2xlYW5lZFVwRm4gPSAoKSA9PlxuICAgICAgY29uc29sZS5sb2cgJ1dvcmtlciBxdWl0dGluZydcbiAgICAgIEBlbWl0ICdxdWl0J1xuXG4gICAgICBkb25lKClcblxuICAgICMgQFRPRE86IGdyYWNlZnVsIHNodXRkb3duIHRpbWVyLlxuICAgIEBxdWV1ZS5jb25jdXJyZW5jeSA9IDBcbiAgICBAaXNTaHV0dGluZ0Rvd24gICAgPSB0cnVlXG5cbiAgICAjIENhbGxiYWNrIGFmdGVyIGZpbmlzaGluZyBhbGwgdGhlIGl0ZW1zLlxuICAgIGlmIEBxdWV1ZS5pZGxlKClcbiAgICAgIHJldHVybiBfY2xlYW5lZFVwRm4oKVxuXG4gICAgQHF1ZXVlLmRyYWluID0gX2NsZWFuZWRVcEZuXG5cbiAgIyBFeGVjdXRlIG9uZSB0YXNrXG4gIGV4ZWN1dGVUYXNrOiAodGFzaywgZG9uZSkgPT5cbiAgICAjIEBUT0RPOiBXcmFwIGV2ZXJ5dGhpbmcgaW4gZG9tYWlucyBhbmQgaGFuZGxlIGV4Y2VwdGlvbnMgcHJvcGVybHkuXG4gICAgQE1vZGVsLl9tb25nb1F1ZXVlck9wdGlvbnMudGFza0ZuIHRhc2ssICh0YXNrRXJyLCByZXN1bHQpID0+XG4gICAgICBfZGlkSGFuZGxlVGFza0ZuID0gKGVyciwgdGFzaykgPT5cbiAgICAgICAgQG5vdGlmeUVycm9yIGVyciBpZiBlcnI/XG4gICAgICAgIHVubGVzcyB0YXNrP1xuICAgICAgICAgIEBub3RpZnlFcnJvciAnVGFzayB3YXMgY2xhaW1lZCBieSBhIGRpZmZlcmVudCBvd25lciwgc3RhdHVzIHVwZGF0ZSBkaWQgbm90IHN1Y2NlZWQuJ1xuXG4gICAgICAgIGRvbmUoKVxuXG4gICAgICBpZiB0YXNrRXJyP1xuICAgICAgICB0YXNrLl91cGRhdGVTdGF0dXMgJ0ZBSUxFRCcsICdGQUlMRURfRVJSJywgeyBlcnJvcjogdGFza0VyciB9LCBfZGlkSGFuZGxlVGFza0ZuXG4gICAgICBlbHNlXG4gICAgICAgIHRhc2suX3VwZGF0ZVN0YXR1cyAnU1VDQ0VTUycsIG51bGwsIHsgcmVzdWx0OiByZXN1bHQgfSwgX2RpZEhhbmRsZVRhc2tGblxuXG4gICMgUG9sbGluZyBjb250cm9sXG4gIHNldFBvbGxpbmdDYWxsYmFjazogKGNiKSA9PlxuICAgIEBfcG9sbERlbGF5ZWRDYWxsYmFjayA9IGNiXG5cbiAgZXhlY3V0ZVBvbGxpbmdDYWxsYmFjazogKGVycikgPT5cbiAgICBjbGVhclRpbWVvdXQgQHBvbGxUaW1lciBpZiBAcG9sbFRpbWVyP1xuICAgIEBwb2xsVGltZXIgPSBudWxsXG5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJAX3BvbGxEZWxheWVkQ2FsbGJhY2sgbm90IHNldCwgY3JpdGljYWwgZXJyb3IsIHNob3VsZCBuZXZlciBoYXZlIGhhcHBlbmVkIVwiIHVubGVzcyBAX3BvbGxEZWxheWVkQ2FsbGJhY2s/XG5cbiAgICBmbiA9IEBfcG9sbERlbGF5ZWRDYWxsYmFja1xuICAgIEBzZXRQb2xsaW5nQ2FsbGJhY2sgbnVsbFxuICAgIGZuKGVycilcblxuICBwb2xsQWdhaW5JblNvbWVUaW1lOiAoKSA9PlxuICAgIHJldHVybiBpZiBAcG9sbFRpbWVyP1xuICAgIEBwb2xsVGltZXIgPSBzZXRUaW1lb3V0IEBleGVjdXRlUG9sbGluZ0NhbGxiYWNrLCBAcG9sbEludGVydmFsXG5cbiAgcG9sbE5vdzogKCkgPT5cbiAgICBAZXhlY3V0ZVBvbGxpbmdDYWxsYmFjaygpXG5cbiAgIyBGZXRjaCB0YXNrc1xuICBydW46ICgpIC0+XG4gICAgcGVuZGluZ0RlcXVldWVzID0gMFxuXG4gICAgYXN5bmMuZm9yZXZlciAoZG9uZSkgPT5cbiAgICAgIEBzZXRQb2xsaW5nQ2FsbGJhY2sgZG9uZVxuXG4gICAgICByZXR1cm4gQGV4ZWN1dGVQb2xsaW5nQ2FsbGJhY2sgbmV3IFF1ZXVlckVycm9ycy5TaHV0ZG93bkVycm9yKCkgaWYgQGlzU2h1dHRpbmdEb3duXG5cbiAgICAgIGlmIEBxdWV1ZS5sZW5ndGgoKSArIEBxdWV1ZS5ydW5uaW5nKCkgKyBwZW5kaW5nRGVxdWV1ZXMgPj0gQHF1ZXVlLmNvbmN1cnJlbmN5XG4gICAgICAgIHJldHVybiBAcG9sbEFnYWluSW5Tb21lVGltZSgpXG5cbiAgICAgIHBlbmRpbmdEZXF1ZXVlcyArPSAxXG4gICAgICBATW9kZWwuX2RlcXVldWVPbmUgKGVyciwgb2JqZWN0KSA9PlxuICAgICAgICBwZW5kaW5nRGVxdWV1ZXMgLT0gMVxuXG4gICAgICAgIGlmIGVycj9cbiAgICAgICAgICBAbm90aWZ5RXJyb3IgZXJyXG4gICAgICAgICAgcmV0dXJuIEBwb2xsQWdhaW5JblNvbWVUaW1lKClcblxuICAgICAgICB1bmxlc3Mgb2JqZWN0P1xuICAgICAgICAgIHJldHVybiBAcG9sbEFnYWluSW5Tb21lVGltZSgpXG5cbiAgICAgICAgQHF1ZXVlLnB1c2ggb2JqZWN0LCAoKSA9PiBAcG9sbE5vdygpXG4gICAgICAgIEBwb2xsTm93KClcbiAgICAsIChlcnIpID0+XG4gICAgICBAbm90aWZ5RXJyb3IgZXJyXG5cblxubW9kdWxlLmV4cG9ydHMgPSBXb3JrZXJcbiJdfQ==
