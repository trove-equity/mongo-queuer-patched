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
    async.forever((function(_this) {
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
    return this.emit('ready');
  };

  return Worker;

})(EventEmitter);

module.exports = Worker;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliL3dvcmtlci5qcyIsInNvdXJjZXMiOlsibGliL3dvcmtlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSx5Q0FBQTtFQUFBOzs7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSOztBQUVSLFlBQUEsR0FBZSxPQUFBLENBQVEsUUFBUixDQUFpQixDQUFDOztBQUVqQyxZQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBSVQ7OztFQUNTLGdCQUFDLEtBQUQsRUFBUyxHQUFUO0FBQ1gsUUFBQTtJQURZLElBQUMsQ0FBQSxRQUFEO3dCQUFRLE1BQTRDLElBQTFDLElBQUMsQ0FBQSx3REFBYyxHQUFHLElBQUMsQ0FBQSwwREFBZTs7Ozs7O0lBQ3hELElBQW1GLGtCQUFuRjtBQUFBLFlBQU0sSUFBSSxLQUFKLENBQVUsMERBQVYsRUFBTjs7SUFDQSxJQUFzRSxzQ0FBdEU7QUFBQSxZQUFNLElBQUksS0FBSixDQUFVLDZDQUFWLEVBQU47O0lBR0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxLQUFLLENBQUMsS0FBTixDQUFZLElBQUMsQ0FBQSxXQUFiLEVBQTBCLElBQUMsQ0FBQSxXQUEzQjtJQUNULElBQUMsQ0FBQSxjQUFELEdBQWtCO0VBTlA7O21CQVNiLFdBQUEsR0FBYSxTQUFDLEdBQUQ7SUFDWCxJQUFHLEdBQUEsWUFBZSxZQUFZLENBQUMsYUFBL0I7YUFDRSxPQUFPLENBQUMsR0FBUixDQUFZLHVEQUFaLEVBREY7S0FBQSxNQUFBO01BR0UsT0FBTyxDQUFDLEdBQVIsQ0FBWSxHQUFaO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxPQUFOLEVBQWUsR0FBZixFQUpGOztFQURXOzttQkFRYixRQUFBLEdBQVUsU0FBQyxJQUFEO0FBQ1IsUUFBQTtJQUFBLElBQVUsSUFBQyxDQUFBLGNBQVg7QUFBQSxhQUFBOztJQUVBLFlBQUEsR0FBZSxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUE7UUFDYixPQUFPLENBQUMsR0FBUixDQUFZLGlCQUFa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RUFBTSxNQUFOO1VBQ2pCLGVBQUEsSUFBbUI7VUFFbkIsSUFBRyxXQUFIO1lBQ0UsS0FBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiO0FBQ0EsbUJBQU8sS0FBQyxDQUFBLG1CQUFELENBQUEsRUFGVDs7VUFJQSxJQUFPLGNBQVA7QUFDRSxtQkFBTyxLQUFDLENBQUEsbUJBQUQsQ0FBQSxFQURUOztVQUdBLEtBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFZLE1BQVosRUFBb0IsU0FBQTttQkFBTSxLQUFDLENBQUEsT0FBRCxDQUFBO1VBQU4sQ0FBcEI7aUJBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBQTtRQVhpQixDQUFuQjtNQVRZO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFkLEVBcUJFLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQyxHQUFEO2VBQ0EsS0FBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiO01BREE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBckJGO1dBd0JBLElBQUMsQ0FBQSxJQUFELENBQU0sT0FBTjtFQTNCRzs7OztHQTNFYzs7QUF5R3JCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiYXN5bmMgPSByZXF1aXJlKCdhc3luYycpXG5cbkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlclxuXG5RdWV1ZXJFcnJvcnMgPSByZXF1aXJlKCcuL2Vycm9ycycpXG5cblxuIyBAVE9ETzogV3JhcCBpbiBkb21haW5zXG5jbGFzcyBXb3JrZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAgY29uc3RydWN0b3I6IChATW9kZWwsIHsgQGNvbmN1cnJlbmN5ID0gMSwgQHBvbGxJbnRlcnZhbCA9IDUwMCB9ID0ge30pIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiJ01vZGVsJyBtdXN0IGJlIHBhc3NlZCB0byBNb25nb1F1ZXVlci5Xb3JrZXIgY29uc3RydWN0b3JcIikgdW5sZXNzIEBNb2RlbD9cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCInTW9kZWwnIG11c3QgdXNlIHRoZSBNb25nb1F1ZXVlci5UYXNrUGx1Z2luXCIpIHVubGVzcyBATW9kZWwuX21vbmdvUXVldWVyT3B0aW9ucz9cblxuICAgICMgSW50ZXJuYWwgc3RhdGVcbiAgICBAcXVldWUgPSBhc3luYy5xdWV1ZSBAZXhlY3V0ZVRhc2ssIEBjb25jdXJyZW5jeVxuICAgIEBpc1NodXR0aW5nRG93biA9IGZhbHNlXG5cbiAgIyBFcnJvciBub3RpZmljYXRpb25zXG4gIG5vdGlmeUVycm9yOiAoZXJyKSAtPlxuICAgIGlmIGVyciBpbnN0YW5jZW9mIFF1ZXVlckVycm9ycy5TaHV0ZG93bkVycm9yXG4gICAgICBjb25zb2xlLmxvZyAnUHJvY2VzcyBnb25lIGludG8gc2h1dGRvd24gbW9kZS4gTm90IHBvbGxpbmcgYW55bW9yZS4nXG4gICAgZWxzZVxuICAgICAgY29uc29sZS5sb2cgZXJyXG4gICAgICBAZW1pdCAnZXJyb3InLCBlcnJcblxuICAjIFNodXRkb3duXG4gIHNodXRkb3duOiAoZG9uZSkgLT5cbiAgICByZXR1cm4gaWYgQGlzU2h1dHRpbmdEb3duXG5cbiAgICBfY2xlYW5lZFVwRm4gPSAoKSA9PlxuICAgICAgY29uc29sZS5sb2cgJ1dvcmtlciBxdWl0dGluZydcbiAgICAgIEBlbWl0ICdxdWl0J1xuXG4gICAgICBkb25lKClcblxuICAgICMgQFRPRE86IGdyYWNlZnVsIHNodXRkb3duIHRpbWVyLlxuICAgIEBxdWV1ZS5jb25jdXJyZW5jeSA9IDBcbiAgICBAaXNTaHV0dGluZ0Rvd24gICAgPSB0cnVlXG5cbiAgICAjIENhbGxiYWNrIGFmdGVyIGZpbmlzaGluZyBhbGwgdGhlIGl0ZW1zLlxuICAgIGlmIEBxdWV1ZS5pZGxlKClcbiAgICAgIHJldHVybiBfY2xlYW5lZFVwRm4oKVxuXG4gICAgQHF1ZXVlLmRyYWluID0gX2NsZWFuZWRVcEZuXG5cbiAgIyBFeGVjdXRlIG9uZSB0YXNrXG4gIGV4ZWN1dGVUYXNrOiAodGFzaywgZG9uZSkgPT5cbiAgICAjIEBUT0RPOiBXcmFwIGV2ZXJ5dGhpbmcgaW4gZG9tYWlucyBhbmQgaGFuZGxlIGV4Y2VwdGlvbnMgcHJvcGVybHkuXG4gICAgQE1vZGVsLl9tb25nb1F1ZXVlck9wdGlvbnMudGFza0ZuIHRhc2ssICh0YXNrRXJyLCByZXN1bHQpID0+XG4gICAgICBfZGlkSGFuZGxlVGFza0ZuID0gKGVyciwgdGFzaykgPT5cbiAgICAgICAgQG5vdGlmeUVycm9yIGVyciBpZiBlcnI/XG4gICAgICAgIHVubGVzcyB0YXNrP1xuICAgICAgICAgIEBub3RpZnlFcnJvciAnVGFzayB3YXMgY2xhaW1lZCBieSBhIGRpZmZlcmVudCBvd25lciwgc3RhdHVzIHVwZGF0ZSBkaWQgbm90IHN1Y2NlZWQuJ1xuXG4gICAgICAgIGRvbmUoKVxuXG4gICAgICBpZiB0YXNrRXJyP1xuICAgICAgICB0YXNrLl91cGRhdGVTdGF0dXMgJ0ZBSUxFRCcsICdGQUlMRURfRVJSJywgeyBlcnJvcjogdGFza0VyciB9LCBfZGlkSGFuZGxlVGFza0ZuXG4gICAgICBlbHNlXG4gICAgICAgIHRhc2suX3VwZGF0ZVN0YXR1cyAnU1VDQ0VTUycsIG51bGwsIHsgcmVzdWx0OiByZXN1bHQgfSwgX2RpZEhhbmRsZVRhc2tGblxuXG4gICMgUG9sbGluZyBjb250cm9sXG4gIHNldFBvbGxpbmdDYWxsYmFjazogKGNiKSA9PlxuICAgIEBfcG9sbERlbGF5ZWRDYWxsYmFjayA9IGNiXG5cbiAgZXhlY3V0ZVBvbGxpbmdDYWxsYmFjazogKGVycikgPT5cbiAgICBjbGVhclRpbWVvdXQgQHBvbGxUaW1lciBpZiBAcG9sbFRpbWVyP1xuICAgIEBwb2xsVGltZXIgPSBudWxsXG5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJAX3BvbGxEZWxheWVkQ2FsbGJhY2sgbm90IHNldCwgY3JpdGljYWwgZXJyb3IsIHNob3VsZCBuZXZlciBoYXZlIGhhcHBlbmVkIVwiIHVubGVzcyBAX3BvbGxEZWxheWVkQ2FsbGJhY2s/XG5cbiAgICBmbiA9IEBfcG9sbERlbGF5ZWRDYWxsYmFja1xuICAgIEBzZXRQb2xsaW5nQ2FsbGJhY2sgbnVsbFxuICAgIGZuKGVycilcblxuICBwb2xsQWdhaW5JblNvbWVUaW1lOiAoKSA9PlxuICAgIHJldHVybiBpZiBAcG9sbFRpbWVyP1xuICAgIEBwb2xsVGltZXIgPSBzZXRUaW1lb3V0IEBleGVjdXRlUG9sbGluZ0NhbGxiYWNrLCBAcG9sbEludGVydmFsXG5cbiAgcG9sbE5vdzogKCkgPT5cbiAgICBAZXhlY3V0ZVBvbGxpbmdDYWxsYmFjaygpXG5cbiAgIyBGZXRjaCB0YXNrc1xuICBydW46ICgpIC0+XG4gICAgcGVuZGluZ0RlcXVldWVzID0gMFxuXG4gICAgYXN5bmMuZm9yZXZlciAoZG9uZSkgPT5cbiAgICAgIEBzZXRQb2xsaW5nQ2FsbGJhY2sgZG9uZVxuXG4gICAgICByZXR1cm4gQGV4ZWN1dGVQb2xsaW5nQ2FsbGJhY2sgbmV3IFF1ZXVlckVycm9ycy5TaHV0ZG93bkVycm9yKCkgaWYgQGlzU2h1dHRpbmdEb3duXG5cbiAgICAgIGlmIEBxdWV1ZS5sZW5ndGgoKSArIEBxdWV1ZS5ydW5uaW5nKCkgKyBwZW5kaW5nRGVxdWV1ZXMgPj0gQHF1ZXVlLmNvbmN1cnJlbmN5XG4gICAgICAgIHJldHVybiBAcG9sbEFnYWluSW5Tb21lVGltZSgpXG5cbiAgICAgIHBlbmRpbmdEZXF1ZXVlcyArPSAxXG4gICAgICBATW9kZWwuX2RlcXVldWVPbmUgKGVyciwgb2JqZWN0KSA9PlxuICAgICAgICBwZW5kaW5nRGVxdWV1ZXMgLT0gMVxuXG4gICAgICAgIGlmIGVycj9cbiAgICAgICAgICBAbm90aWZ5RXJyb3IgZXJyXG4gICAgICAgICAgcmV0dXJuIEBwb2xsQWdhaW5JblNvbWVUaW1lKClcblxuICAgICAgICB1bmxlc3Mgb2JqZWN0P1xuICAgICAgICAgIHJldHVybiBAcG9sbEFnYWluSW5Tb21lVGltZSgpXG5cbiAgICAgICAgQHF1ZXVlLnB1c2ggb2JqZWN0LCAoKSA9PiBAcG9sbE5vdygpXG4gICAgICAgIEBwb2xsTm93KClcbiAgICAsIChlcnIpID0+XG4gICAgICBAbm90aWZ5RXJyb3IgZXJyXG5cbiAgICBAZW1pdCAncmVhZHknXG5cblxubW9kdWxlLmV4cG9ydHMgPSBXb3JrZXJcbiJdfQ==
