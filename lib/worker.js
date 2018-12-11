var EventEmitter, HEALTHY_STATUS, QueuerErrors, UNHEALTHY_STATUS, Worker, async, ref,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

async = require('async');

EventEmitter = require('events').EventEmitter;

QueuerErrors = require('./errors');

ref = require('./healthcheck_statuses'), HEALTHY_STATUS = ref.HEALTHY_STATUS, UNHEALTHY_STATUS = ref.UNHEALTHY_STATUS;

Worker = (function(superClass) {
  extend(Worker, superClass);

  function Worker(Model, arg) {
    var ref1, ref2, ref3;
    this.Model = Model;
    ref1 = arg != null ? arg : {}, this.concurrency = (ref2 = ref1.concurrency) != null ? ref2 : 1, this.pollInterval = (ref3 = ref1.pollInterval) != null ? ref3 : 500;
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
      this.notifyHealthStatus(UNHEALTHY_STATUS);
      throw new Error("@_pollDelayedCallback not set, critical error, should never have happened!");
    }
    if (err != null) {
      this.notifyHealthStatus(UNHEALTHY_STATUS);
    } else {
      this.notifyHealthStatus(HEALTHY_STATUS);
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

  Worker.prototype.notifyHealthStatus = function(status) {
    this.healthStatus = status;
    return this.emit(status);
  };

  return Worker;

})(EventEmitter);

module.exports = Worker;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliL3dvcmtlci5qcyIsInNvdXJjZXMiOlsibGliL3dvcmtlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxnRkFBQTtFQUFBOzs7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSOztBQUVSLFlBQUEsR0FBZSxPQUFBLENBQVEsUUFBUixDQUFpQixDQUFDOztBQUNqQyxZQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsTUFBdUMsT0FBQSxDQUFRLHdCQUFSLENBQXZDLEVBQUUsbUNBQUYsRUFBa0I7O0FBR1o7OztFQUNTLGdCQUFDLEtBQUQsRUFBUyxHQUFUO0FBQ1gsUUFBQTtJQURZLElBQUMsQ0FBQSxRQUFEO3lCQUFRLE1BQTRDLElBQTFDLElBQUMsQ0FBQSx5REFBYyxHQUFHLElBQUMsQ0FBQSwyREFBZTs7Ozs7O0lBQ3hELElBQW1GLGtCQUFuRjtBQUFBLFlBQU0sSUFBSSxLQUFKLENBQVUsMERBQVYsRUFBTjs7SUFDQSxJQUFzRSxzQ0FBdEU7QUFBQSxZQUFNLElBQUksS0FBSixDQUFVLDZDQUFWLEVBQU47O0lBR0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxLQUFLLENBQUMsS0FBTixDQUFZLElBQUMsQ0FBQSxXQUFiLEVBQTBCLElBQUMsQ0FBQSxXQUEzQjtJQUNULElBQUMsQ0FBQSxjQUFELEdBQWtCO0VBTlA7O21CQVNiLFdBQUEsR0FBYSxTQUFDLEdBQUQ7SUFDWCxJQUFHLEdBQUEsWUFBZSxZQUFZLENBQUMsYUFBL0I7YUFDRSxPQUFPLENBQUMsR0FBUixDQUFZLHVEQUFaLEVBREY7S0FBQSxNQUFBO01BR0UsT0FBTyxDQUFDLEdBQVIsQ0FBWSxHQUFaO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxPQUFOLEVBQWUsR0FBZixFQUpGOztFQURXOzttQkFRYixRQUFBLEdBQVUsU0FBQyxJQUFEO0FBQ1IsUUFBQTtJQUFBLElBQVUsSUFBQyxDQUFBLGNBQVg7QUFBQSxhQUFBOztJQUVBLFlBQUEsR0FBZSxDQUFB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QWtCLEtBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFBLENBQWxCLEdBQXFDLGVBQXJDLElBQXdELEtBQUMsQ0FBQSxLQUFLLENBQUMsV0FBbEU7QUFDRSxpQkFBTyxLQUFDLENBQUEsbUJBQUQsQ0FBQSxFQURUOztRQUdBLGVBQUEsSUFBbUI7ZUFDbkIsS0FBQyxDQUFBLEtBQUssQ0FBQyxXQUFQLENBQW1CLFNBQUMsR0FBRCxFQUFNLE1BQU47VUFDakIsZUFBQSxJQUFtQjtVQUVuQixJQUFHLFdBQUg7WUFDRSxLQUFDLENBQUEsV0FBRCxDQUFhLEdBQWI7QUFDQSxtQkFBTyxLQUFDLENBQUEsbUJBQUQsQ0FBQSxFQUZUOztVQUlBLElBQU8sY0FBUDtBQUNFLG1CQUFPLEtBQUMsQ0FBQSxtQkFBRCxDQUFBLEVBRFQ7O1VBR0EsS0FBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksTUFBWixFQUFvQixTQUFBO21CQUFNLEtBQUMsQ0FBQSxPQUFELENBQUE7VUFBTixDQUFwQjtpQkFDQSxLQUFDLENBQUEsT0FBRCxDQUFBO1FBWGlCLENBQW5CO01BVlk7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWQsRUFzQkUsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFDLEdBQUQ7ZUFDQSxLQUFDLENBQUEsV0FBRCxDQUFhLEdBQWI7TUFEQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F0QkY7RUFIRzs7bUJBNEJMLGtCQUFBLEdBQW9CLFNBQUMsTUFBRDtJQUNsQixJQUFDLENBQUEsWUFBRCxHQUFnQjtXQUNoQixJQUFDLENBQUEsSUFBRCxDQUFNLE1BQU47RUFGa0I7Ozs7R0E5R0Q7O0FBa0hyQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbImFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKVxuXG5FdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcblF1ZXVlckVycm9ycyA9IHJlcXVpcmUoJy4vZXJyb3JzJylcbnsgSEVBTFRIWV9TVEFUVVMsIFVOSEVBTFRIWV9TVEFUVVMgfSA9IHJlcXVpcmUoJy4vaGVhbHRoY2hlY2tfc3RhdHVzZXMnKVxuXG4jIEBUT0RPOiBXcmFwIGluIGRvbWFpbnNcbmNsYXNzIFdvcmtlciBleHRlbmRzIEV2ZW50RW1pdHRlclxuICBjb25zdHJ1Y3RvcjogKEBNb2RlbCwgeyBAY29uY3VycmVuY3kgPSAxLCBAcG9sbEludGVydmFsID0gNTAwIH0gPSB7fSkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCInTW9kZWwnIG11c3QgYmUgcGFzc2VkIHRvIE1vbmdvUXVldWVyLldvcmtlciBjb25zdHJ1Y3RvclwiKSB1bmxlc3MgQE1vZGVsP1xuICAgIHRocm93IG5ldyBFcnJvcihcIidNb2RlbCcgbXVzdCB1c2UgdGhlIE1vbmdvUXVldWVyLlRhc2tQbHVnaW5cIikgdW5sZXNzIEBNb2RlbC5fbW9uZ29RdWV1ZXJPcHRpb25zP1xuXG4gICAgIyBJbnRlcm5hbCBzdGF0ZVxuICAgIEBxdWV1ZSA9IGFzeW5jLnF1ZXVlIEBleGVjdXRlVGFzaywgQGNvbmN1cnJlbmN5XG4gICAgQGlzU2h1dHRpbmdEb3duID0gZmFsc2VcblxuICAjIEVycm9yIG5vdGlmaWNhdGlvbnNcbiAgbm90aWZ5RXJyb3I6IChlcnIpIC0+XG4gICAgaWYgZXJyIGluc3RhbmNlb2YgUXVldWVyRXJyb3JzLlNodXRkb3duRXJyb3JcbiAgICAgIGNvbnNvbGUubG9nICdQcm9jZXNzIGdvbmUgaW50byBzaHV0ZG93biBtb2RlLiBOb3QgcG9sbGluZyBhbnltb3JlLidcbiAgICBlbHNlXG4gICAgICBjb25zb2xlLmxvZyBlcnJcbiAgICAgIEBlbWl0ICdlcnJvcicsIGVyclxuXG4gICMgU2h1dGRvd25cbiAgc2h1dGRvd246IChkb25lKSAtPlxuICAgIHJldHVybiBpZiBAaXNTaHV0dGluZ0Rvd25cblxuICAgIF9jbGVhbmVkVXBGbiA9ICgpID0+XG4gICAgICBjb25zb2xlLmxvZyAnV29ya2VyIHF1aXR0aW5nJ1xuICAgICAgQGVtaXQgJ3F1aXQnXG5cbiAgICAgIGRvbmUoKVxuXG4gICAgIyBAVE9ETzogZ3JhY2VmdWwgc2h1dGRvd24gdGltZXIuXG4gICAgQHF1ZXVlLmNvbmN1cnJlbmN5ID0gMFxuICAgIEBpc1NodXR0aW5nRG93biAgICA9IHRydWVcblxuICAgICMgQ2FsbGJhY2sgYWZ0ZXIgZmluaXNoaW5nIGFsbCB0aGUgaXRlbXMuXG4gICAgaWYgQHF1ZXVlLmlkbGUoKVxuICAgICAgcmV0dXJuIF9jbGVhbmVkVXBGbigpXG5cbiAgICBAcXVldWUuZHJhaW4gPSBfY2xlYW5lZFVwRm5cblxuICAjIEV4ZWN1dGUgb25lIHRhc2tcbiAgZXhlY3V0ZVRhc2s6ICh0YXNrLCBkb25lKSA9PlxuICAgICMgQFRPRE86IFdyYXAgZXZlcnl0aGluZyBpbiBkb21haW5zIGFuZCBoYW5kbGUgZXhjZXB0aW9ucyBwcm9wZXJseS5cbiAgICBATW9kZWwuX21vbmdvUXVldWVyT3B0aW9ucy50YXNrRm4gdGFzaywgKHRhc2tFcnIsIHJlc3VsdCkgPT5cbiAgICAgIF9kaWRIYW5kbGVUYXNrRm4gPSAoZXJyLCB0YXNrKSA9PlxuICAgICAgICBAbm90aWZ5RXJyb3IgZXJyIGlmIGVycj9cbiAgICAgICAgdW5sZXNzIHRhc2s/XG4gICAgICAgICAgQG5vdGlmeUVycm9yICdUYXNrIHdhcyBjbGFpbWVkIGJ5IGEgZGlmZmVyZW50IG93bmVyLCBzdGF0dXMgdXBkYXRlIGRpZCBub3Qgc3VjY2VlZC4nXG5cbiAgICAgICAgZG9uZSgpXG5cbiAgICAgIGlmIHRhc2tFcnI/XG4gICAgICAgIHRhc2suX3VwZGF0ZVN0YXR1cyAnRkFJTEVEJywgJ0ZBSUxFRF9FUlInLCB7IGVycm9yOiB0YXNrRXJyIH0sIF9kaWRIYW5kbGVUYXNrRm5cbiAgICAgIGVsc2VcbiAgICAgICAgdGFzay5fdXBkYXRlU3RhdHVzICdTVUNDRVNTJywgbnVsbCwgeyByZXN1bHQ6IHJlc3VsdCB9LCBfZGlkSGFuZGxlVGFza0ZuXG5cbiAgIyBQb2xsaW5nIGNvbnRyb2xcbiAgc2V0UG9sbGluZ0NhbGxiYWNrOiAoY2IpID0+XG4gICAgQF9wb2xsRGVsYXllZENhbGxiYWNrID0gY2JcblxuICBleGVjdXRlUG9sbGluZ0NhbGxiYWNrOiAoZXJyKSA9PlxuICAgIGNsZWFyVGltZW91dCBAcG9sbFRpbWVyIGlmIEBwb2xsVGltZXI/XG4gICAgQHBvbGxUaW1lciA9IG51bGxcblxuICAgIHVubGVzcyBAX3BvbGxEZWxheWVkQ2FsbGJhY2s/XG4gICAgICBAbm90aWZ5SGVhbHRoU3RhdHVzIFVOSEVBTFRIWV9TVEFUVVNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkBfcG9sbERlbGF5ZWRDYWxsYmFjayBub3Qgc2V0LCBjcml0aWNhbCBlcnJvciwgc2hvdWxkIG5ldmVyIGhhdmUgaGFwcGVuZWQhXCJcblxuICAgIGlmIGVycj9cbiAgICAgIEBub3RpZnlIZWFsdGhTdGF0dXMgVU5IRUFMVEhZX1NUQVRVU1xuICAgIGVsc2VcbiAgICAgIEBub3RpZnlIZWFsdGhTdGF0dXMgSEVBTFRIWV9TVEFUVVNcblxuICAgIGZuID0gQF9wb2xsRGVsYXllZENhbGxiYWNrXG4gICAgQHNldFBvbGxpbmdDYWxsYmFjayBudWxsXG4gICAgZm4oZXJyKVxuXG4gIHBvbGxBZ2FpbkluU29tZVRpbWU6ICgpID0+XG4gICAgcmV0dXJuIGlmIEBwb2xsVGltZXI/XG4gICAgQHBvbGxUaW1lciA9IHNldFRpbWVvdXQgQGV4ZWN1dGVQb2xsaW5nQ2FsbGJhY2ssIEBwb2xsSW50ZXJ2YWxcblxuICBwb2xsTm93OiAoKSA9PlxuICAgIEBleGVjdXRlUG9sbGluZ0NhbGxiYWNrKClcblxuICAjIEZldGNoIHRhc2tzXG4gIHJ1bjogKCkgLT5cbiAgICBwZW5kaW5nRGVxdWV1ZXMgPSAwXG5cbiAgICBhc3luYy5mb3JldmVyIChkb25lKSA9PlxuICAgICAgQHNldFBvbGxpbmdDYWxsYmFjayBkb25lXG5cbiAgICAgIGlmIEBpc1NodXR0aW5nRG93blxuICAgICAgICByZXR1cm4gQGV4ZWN1dGVQb2xsaW5nQ2FsbGJhY2sgbmV3IFF1ZXVlckVycm9ycy5TaHV0ZG93bkVycm9yKClcblxuICAgICAgaWYgQHF1ZXVlLmxlbmd0aCgpICsgQHF1ZXVlLnJ1bm5pbmcoKSArIHBlbmRpbmdEZXF1ZXVlcyA+PSBAcXVldWUuY29uY3VycmVuY3lcbiAgICAgICAgcmV0dXJuIEBwb2xsQWdhaW5JblNvbWVUaW1lKClcblxuICAgICAgcGVuZGluZ0RlcXVldWVzICs9IDFcbiAgICAgIEBNb2RlbC5fZGVxdWV1ZU9uZSAoZXJyLCBvYmplY3QpID0+XG4gICAgICAgIHBlbmRpbmdEZXF1ZXVlcyAtPSAxXG5cbiAgICAgICAgaWYgZXJyP1xuICAgICAgICAgIEBub3RpZnlFcnJvciBlcnJcbiAgICAgICAgICByZXR1cm4gQHBvbGxBZ2FpbkluU29tZVRpbWUoKVxuXG4gICAgICAgIHVubGVzcyBvYmplY3Q/XG4gICAgICAgICAgcmV0dXJuIEBwb2xsQWdhaW5JblNvbWVUaW1lKClcblxuICAgICAgICBAcXVldWUucHVzaCBvYmplY3QsICgpID0+IEBwb2xsTm93KClcbiAgICAgICAgQHBvbGxOb3coKVxuICAgICwgKGVycikgPT5cbiAgICAgIEBub3RpZnlFcnJvciBlcnJcblxuICBub3RpZnlIZWFsdGhTdGF0dXM6IChzdGF0dXMpIC0+XG4gICAgQGhlYWx0aFN0YXR1cyA9IHN0YXR1c1xuICAgIEBlbWl0IHN0YXR1c1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmtlclxuIl19
