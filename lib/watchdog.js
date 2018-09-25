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
    async.forever((function(_this) {
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
    return this.emit('ready');
  };

  return Watchdog;

})(EventEmitter);

module.exports = Watchdog;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliL3dhdGNoZG9nLmpzIiwic291cmNlcyI6WyJsaWIvd2F0Y2hkb2cuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUEsMkNBQUE7RUFBQTs7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSOztBQUVSLFlBQUEsR0FBZSxPQUFBLENBQVEsUUFBUixDQUFpQixDQUFDOztBQUVqQyxZQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBR1Q7OztFQUNTLGtCQUFDLEtBQUQsRUFBUSxHQUFSO0FBQ1gsUUFBQTtJQURxQixJQUFDLENBQUEsNkVBQWU7SUFDckMsSUFBcUYsYUFBckY7QUFBQSxZQUFNLElBQUksS0FBSixDQUFVLDREQUFWLEVBQU47O0lBQ0EsSUFBc0UsaUNBQXRFO0FBQUEsWUFBTSxJQUFJLEtBQUosQ0FBVSw2Q0FBVixFQUFOOztJQUdBLElBQUMsQ0FBQSxLQUFELEdBQVM7SUFHVCxJQUFDLENBQUEsY0FBRCxHQUFrQjtFQVJQOztxQkFXYixXQUFBLEdBQWEsU0FBQyxHQUFEO0lBQ1gsSUFBRyxHQUFBLFlBQWUsWUFBWSxDQUFDLGFBQS9CO2FBQ0UsT0FBTyxDQUFDLEdBQVIsQ0FBWSx1REFBWixFQURGO0tBQUEsTUFBQTtNQUdFLE9BQU8sQ0FBQyxHQUFSLENBQVksR0FBWjthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sT0FBTixFQUFlLEdBQWYsRUFKRjs7RUFEVzs7cUJBUWIsUUFBQSxHQUFVLFNBQUMsSUFBRDtBQUNSLFFBQUE7SUFBQSxJQUFVLElBQUMsQ0FBQSxjQUFYO0FBQUEsYUFBQTs7SUFFQSxZQUFBLEdBQWUsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFBO1FBQ2IsT0FBTyxDQUFDLEdBQVIsQ0FBWSxpQkFBWjtRQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sTUFBTjtlQUVBLElBQUEsQ0FBQTtNQUphO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtJQU1mLElBQUMsQ0FBQSxjQUFELEdBQWtCO1dBQ2xCLFlBQUEsQ0FBQTtFQVZROztxQkFhVixHQUFBLEdBQUssU0FBQTtJQUNILEtBQUssQ0FBQyxPQUFOLENBQWMsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFDLElBQUQ7UUFDWixJQUFnRCxLQUFDLENBQUEsY0FBakQ7QUFBQSxpQkFBTyxJQUFBLENBQUssSUFBSSxZQUFZLENBQUMsYUFBakIsQ0FBQSxDQUFMLEVBQVA7O2VBRUEsS0FBQyxDQUFBLEtBQUssQ0FBQyxnQkFBUCxDQUF3QixTQUFDLEdBQUQsRUFBTSxNQUFOO1VBQ3RCLElBQUcsV0FBSDtZQUNFLEtBQUMsQ0FBQSxXQUFELENBQWEsR0FBYjtBQUNBLG1CQUFPLFVBQUEsQ0FBVyxJQUFYLEVBQWlCLEtBQUMsQ0FBQSxZQUFsQixFQUZUOztVQUlBLElBQU8sY0FBUDtBQUNFLG1CQUFPLFVBQUEsQ0FBVyxJQUFYLEVBQWlCLEtBQUMsQ0FBQSxZQUFsQixFQURUOztBQUdBLGlCQUFPLElBQUEsQ0FBQTtRQVJlLENBQXhCO01BSFk7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWQsRUFZRSxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUMsR0FBRDtlQUNBLEtBQUMsQ0FBQSxXQUFELENBQWEsR0FBYjtNQURBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQVpGO1dBZUEsSUFBQyxDQUFBLElBQUQsQ0FBTSxPQUFOO0VBaEJHOzs7O0dBakNnQjs7QUFvRHZCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiYXN5bmMgPSByZXF1aXJlKCdhc3luYycpXG5cbkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlclxuXG5RdWV1ZXJFcnJvcnMgPSByZXF1aXJlKCcuL2Vycm9ycycpXG5cblxuY2xhc3MgV2F0Y2hkb2cgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAgY29uc3RydWN0b3I6IChNb2RlbCwgeyBAcG9sbEludGVydmFsID0gNTAwIH0gPSB7fSkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCInTW9kZWwnIG11c3QgYmUgcGFzc2VkIHRvIE1vbmdvUXVldWVyLldhdGNoZG9nIGNvbnN0cnVjdG9yXCIpIHVubGVzcyBNb2RlbD9cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCInTW9kZWwnIG11c3QgdXNlIHRoZSBNb25nb1F1ZXVlci5UYXNrUGx1Z2luXCIpIHVubGVzcyBNb2RlbC5fbW9uZ29RdWV1ZXJPcHRpb25zP1xuXG4gICAgIyBQYXJhbXNcbiAgICBATW9kZWwgPSBNb2RlbFxuXG4gICAgIyBJbnRlcm5hbCBzdGF0ZVxuICAgIEBpc1NodXR0aW5nRG93biA9IGZhbHNlXG5cbiAgIyBFcnJvciBub3RpZmljYXRpb25zXG4gIG5vdGlmeUVycm9yOiAoZXJyKSAtPlxuICAgIGlmIGVyciBpbnN0YW5jZW9mIFF1ZXVlckVycm9ycy5TaHV0ZG93bkVycm9yXG4gICAgICBjb25zb2xlLmxvZyAnUHJvY2VzcyBnb25lIGludG8gc2h1dGRvd24gbW9kZS4gTm90IHBvbGxpbmcgYW55bW9yZS4nXG4gICAgZWxzZVxuICAgICAgY29uc29sZS5sb2cgZXJyXG4gICAgICBAZW1pdCAnZXJyb3InLCBlcnJcblxuICAjIFNodXRkb3duXG4gIHNodXRkb3duOiAoZG9uZSkgLT5cbiAgICByZXR1cm4gaWYgQGlzU2h1dHRpbmdEb3duXG5cbiAgICBfY2xlYW5lZFVwRm4gPSAoKSA9PlxuICAgICAgY29uc29sZS5sb2cgJ1dvcmtlciBxdWl0dGluZydcbiAgICAgIEBlbWl0ICdxdWl0J1xuXG4gICAgICBkb25lKClcblxuICAgIEBpc1NodXR0aW5nRG93biA9IHRydWVcbiAgICBfY2xlYW5lZFVwRm4oKVxuXG4gICMgRmV0Y2ggdGFza3NcbiAgcnVuOiAoKSAtPlxuICAgIGFzeW5jLmZvcmV2ZXIgKGRvbmUpID0+XG4gICAgICByZXR1cm4gZG9uZSBuZXcgUXVldWVyRXJyb3JzLlNodXRkb3duRXJyb3IoKSBpZiBAaXNTaHV0dGluZ0Rvd25cblxuICAgICAgQE1vZGVsLl9mYWlsVGltZWRPdXRPbmUgKGVyciwgb2JqZWN0KSA9PlxuICAgICAgICBpZiBlcnI/XG4gICAgICAgICAgQG5vdGlmeUVycm9yIGVyclxuICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0IGRvbmUsIEBwb2xsSW50ZXJ2YWxcblxuICAgICAgICB1bmxlc3Mgb2JqZWN0P1xuICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0IGRvbmUsIEBwb2xsSW50ZXJ2YWxcblxuICAgICAgICByZXR1cm4gZG9uZSgpXG4gICAgLCAoZXJyKSA9PlxuICAgICAgQG5vdGlmeUVycm9yIGVyclxuXG4gICAgQGVtaXQgJ3JlYWR5J1xuXG5cbm1vZHVsZS5leHBvcnRzID0gV2F0Y2hkb2dcbiJdfQ==
