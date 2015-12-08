var EventEmitter, QueuerErrors, Watchdog, async,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

async = require('async');

EventEmitter = require('events').EventEmitter;

QueuerErrors = require('./errors');

Watchdog = (function(superClass) {
  extend(Watchdog, superClass);

  function Watchdog(Model, arg) {
    var ref;
    this.pollInterval = (ref = (arg != null ? arg : {}).pollInterval) != null ? ref : 500;
    if (Model == null) {
      throw new Error("'Model' must be passed to MongoQueuer.Watchdog constructor");
    }
    if (Model._mongoQueuerOptions == null) {
      throw new Error("'Model' must use the MongoQueuer.TaskPlugin");
    }
    this.Model = Model;
    this.isShuttingDown = false;
  }

  Watchdog.prototype.notifyError = function(err) {
    if (err instanceof QueuerErrors.ShutdownError) {
      return console.log('Process gone into shutdown mode. Not polling anymore.');
    } else {
      console.log(err);
      return this.emit('error', err);
    }
  };

  Watchdog.prototype.shutdown = function(done) {
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
    this.isShuttingDown = true;
    return _cleanedUpFn();
  };

  Watchdog.prototype.run = function() {
    return async.forever((function(_this) {
      return function(done) {
        if (_this.isShuttingDown) {
          return done(new QueuerErrors.ShutdownError());
        }
        return _this.Model._failTimedOutOne(function(err, object) {
          if (err != null) {
            _this.notifyError(err);
            return setTimeout(done, _this.pollInterval);
          }
          if (object == null) {
            return setTimeout(done, _this.pollInterval);
          }
          return done();
        });
      };
    })(this), (function(_this) {
      return function(err) {
        return _this.notifyError(err);
      };
    })(this));
  };

  return Watchdog;

})(EventEmitter);

module.exports = Watchdog;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi93YXRjaGRvZy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSwyQ0FBQTtFQUFBOzs7QUFBQSxLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVI7O0FBRVIsWUFBQSxHQUFlLE9BQUEsQ0FBUSxRQUFSLENBQWlCLENBQUM7O0FBRWpDLFlBQUEsR0FBZSxPQUFBLENBQVEsVUFBUjs7QUFHVDs7O0VBQ1Msa0JBQUMsS0FBRCxFQUFRLEdBQVI7QUFDWCxRQUFBO0lBRHFCLElBQUMsQ0FBQSw2RUFBZTtJQUNyQyxJQUFxRixhQUFyRjtBQUFBLFlBQVUsSUFBQSxLQUFBLENBQU0sNERBQU4sRUFBVjs7SUFDQSxJQUFzRSxpQ0FBdEU7QUFBQSxZQUFVLElBQUEsS0FBQSxDQUFNLDZDQUFOLEVBQVY7O0lBR0EsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUdULElBQUMsQ0FBQSxjQUFELEdBQWtCO0VBUlA7O3FCQVdiLFdBQUEsR0FBYSxTQUFDLEdBQUQ7SUFDWCxJQUFHLEdBQUEsWUFBZSxZQUFZLENBQUMsYUFBL0I7YUFDRSxPQUFPLENBQUMsR0FBUixDQUFZLHVEQUFaLEVBREY7S0FBQSxNQUFBO01BR0UsT0FBTyxDQUFDLEdBQVIsQ0FBWSxHQUFaO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxPQUFOLEVBQWUsR0FBZixFQUpGOztFQURXOztxQkFRYixRQUFBLEdBQVUsU0FBQyxJQUFEO0FBQ1IsUUFBQTtJQUFBLElBQVUsSUFBQyxDQUFBLGNBQVg7QUFBQSxhQUFBOztJQUVBLFlBQUEsR0FBZSxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUE7UUFDYixPQUFPLENBQUMsR0FBUixDQUFZLGlCQUFaO1FBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxNQUFOO2VBRUEsSUFBQSxDQUFBO01BSmE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO0lBTWYsSUFBQyxDQUFBLGNBQUQsR0FBa0I7V0FDbEIsWUFBQSxDQUFBO0VBVlE7O3FCQWFWLEdBQUEsR0FBSyxTQUFBO1dBQ0gsS0FBSyxDQUFDLE9BQU4sQ0FBYyxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUMsSUFBRDtRQUNaLElBQWdELEtBQUMsQ0FBQSxjQUFqRDtBQUFBLGlCQUFPLElBQUEsQ0FBUyxJQUFBLFlBQVksQ0FBQyxhQUFiLENBQUEsQ0FBVCxFQUFQOztlQUVBLEtBQUMsQ0FBQSxLQUFLLENBQUMsZ0JBQVAsQ0FBd0IsU0FBQyxHQUFELEVBQU0sTUFBTjtVQUN0QixJQUFHLFdBQUg7WUFDRSxLQUFDLENBQUEsV0FBRCxDQUFhLEdBQWI7QUFDQSxtQkFBTyxVQUFBLENBQVcsSUFBWCxFQUFpQixLQUFDLENBQUEsWUFBbEIsRUFGVDs7VUFJQSxJQUFPLGNBQVA7QUFDRSxtQkFBTyxVQUFBLENBQVcsSUFBWCxFQUFpQixLQUFDLENBQUEsWUFBbEIsRUFEVDs7QUFHQSxpQkFBTyxJQUFBLENBQUE7UUFSZSxDQUF4QjtNQUhZO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFkLEVBWUUsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFDLEdBQUQ7ZUFDQSxLQUFDLENBQUEsV0FBRCxDQUFhLEdBQWI7TUFEQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FaRjtFQURHOzs7O0dBakNnQjs7QUFrRHZCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwiZmlsZSI6ImxpYi93YXRjaGRvZy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbImFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKVxuXG5FdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcblxuUXVldWVyRXJyb3JzID0gcmVxdWlyZSgnLi9lcnJvcnMnKVxuXG5cbmNsYXNzIFdhdGNoZG9nIGV4dGVuZHMgRXZlbnRFbWl0dGVyXG4gIGNvbnN0cnVjdG9yOiAoTW9kZWwsIHsgQHBvbGxJbnRlcnZhbCA9IDUwMCB9ID0ge30pIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiJ01vZGVsJyBtdXN0IGJlIHBhc3NlZCB0byBNb25nb1F1ZXVlci5XYXRjaGRvZyBjb25zdHJ1Y3RvclwiKSB1bmxlc3MgTW9kZWw/XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiJ01vZGVsJyBtdXN0IHVzZSB0aGUgTW9uZ29RdWV1ZXIuVGFza1BsdWdpblwiKSB1bmxlc3MgTW9kZWwuX21vbmdvUXVldWVyT3B0aW9ucz9cblxuICAgICMgUGFyYW1zXG4gICAgQE1vZGVsID0gTW9kZWxcblxuICAgICMgSW50ZXJuYWwgc3RhdGVcbiAgICBAaXNTaHV0dGluZ0Rvd24gPSBmYWxzZVxuXG4gICMgRXJyb3Igbm90aWZpY2F0aW9uc1xuICBub3RpZnlFcnJvcjogKGVycikgLT5cbiAgICBpZiBlcnIgaW5zdGFuY2VvZiBRdWV1ZXJFcnJvcnMuU2h1dGRvd25FcnJvclxuICAgICAgY29uc29sZS5sb2cgJ1Byb2Nlc3MgZ29uZSBpbnRvIHNodXRkb3duIG1vZGUuIE5vdCBwb2xsaW5nIGFueW1vcmUuJ1xuICAgIGVsc2VcbiAgICAgIGNvbnNvbGUubG9nIGVyclxuICAgICAgQGVtaXQgJ2Vycm9yJywgZXJyXG5cbiAgIyBTaHV0ZG93blxuICBzaHV0ZG93bjogKGRvbmUpIC0+XG4gICAgcmV0dXJuIGlmIEBpc1NodXR0aW5nRG93blxuXG4gICAgX2NsZWFuZWRVcEZuID0gKCkgPT5cbiAgICAgIGNvbnNvbGUubG9nICdXb3JrZXIgcXVpdHRpbmcnXG4gICAgICBAZW1pdCAncXVpdCdcblxuICAgICAgZG9uZSgpXG5cbiAgICBAaXNTaHV0dGluZ0Rvd24gPSB0cnVlXG4gICAgX2NsZWFuZWRVcEZuKClcblxuICAjIEZldGNoIHRhc2tzXG4gIHJ1bjogKCkgLT5cbiAgICBhc3luYy5mb3JldmVyIChkb25lKSA9PlxuICAgICAgcmV0dXJuIGRvbmUgbmV3IFF1ZXVlckVycm9ycy5TaHV0ZG93bkVycm9yKCkgaWYgQGlzU2h1dHRpbmdEb3duXG5cbiAgICAgIEBNb2RlbC5fZmFpbFRpbWVkT3V0T25lIChlcnIsIG9iamVjdCkgPT5cbiAgICAgICAgaWYgZXJyP1xuICAgICAgICAgIEBub3RpZnlFcnJvciBlcnJcbiAgICAgICAgICByZXR1cm4gc2V0VGltZW91dCBkb25lLCBAcG9sbEludGVydmFsXG5cbiAgICAgICAgdW5sZXNzIG9iamVjdD9cbiAgICAgICAgICByZXR1cm4gc2V0VGltZW91dCBkb25lLCBAcG9sbEludGVydmFsXG5cbiAgICAgICAgcmV0dXJuIGRvbmUoKVxuICAgICwgKGVycikgPT5cbiAgICAgIEBub3RpZnlFcnJvciBlcnJcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFdhdGNoZG9nXG4iXX0=
