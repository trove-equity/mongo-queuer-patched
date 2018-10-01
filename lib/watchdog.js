var EventEmitter, HEALTHY_STATUS, QueuerErrors, UNHEALTHY_STATUS, Watchdog, async, ref,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

async = require('async');

EventEmitter = require('events').EventEmitter;

QueuerErrors = require('./errors');

ref = require('./healthcheck_statuses'), HEALTHY_STATUS = ref.HEALTHY_STATUS, UNHEALTHY_STATUS = ref.UNHEALTHY_STATUS;

Watchdog = (function(superClass) {
  extend(Watchdog, superClass);

  function Watchdog(Model, arg) {
    var ref1;
    this.pollInterval = (ref1 = (arg != null ? arg : {}).pollInterval) != null ? ref1 : 500;
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
          _this.notifyHealthStatusChange(UNHEALTHY_STATUS);
          return done(new QueuerErrors.ShutdownError());
        }
        _this.notifyHealthStatusChange(HEALTHY_STATUS);
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

  Watchdog.prototype.notifyHealthStatusChange = function(status) {
    if (this.healthStatus !== status) {
      this.healthStatus = status;
      return this.emit(status);
    }
  };

  return Watchdog;

})(EventEmitter);

module.exports = Watchdog;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliL3dhdGNoZG9nLmpzIiwic291cmNlcyI6WyJsaWIvd2F0Y2hkb2cuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUEsa0ZBQUE7RUFBQTs7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSOztBQUVSLFlBQUEsR0FBZSxPQUFBLENBQVEsUUFBUixDQUFpQixDQUFDOztBQUNqQyxZQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsTUFBdUMsT0FBQSxDQUFRLHdCQUFSLENBQXZDLEVBQUUsbUNBQUYsRUFBa0I7O0FBRVo7OztFQUNTLGtCQUFDLEtBQUQsRUFBUSxHQUFSO0FBQ1gsUUFBQTtJQURxQixJQUFDLENBQUEsK0VBQWU7SUFDckMsSUFBcUYsYUFBckY7QUFBQSxZQUFNLElBQUksS0FBSixDQUFVLDREQUFWLEVBQU47O0lBQ0EsSUFBc0UsaUNBQXRFO0FBQUEsWUFBTSxJQUFJLEtBQUosQ0FBVSw2Q0FBVixFQUFOOztJQUdBLElBQUMsQ0FBQSxLQUFELEdBQVM7SUFHVCxJQUFDLENBQUEsY0FBRCxHQUFrQjtFQVJQOztxQkFXYixXQUFBLEdBQWEsU0FBQyxHQUFEO0lBQ1gsSUFBRyxHQUFBLFlBQWUsWUFBWSxDQUFDLGFBQS9CO2FBQ0UsT0FBTyxDQUFDLEdBQVIsQ0FBWSx1REFBWixFQURGO0tBQUEsTUFBQTtNQUdFLE9BQU8sQ0FBQyxHQUFSLENBQVksR0FBWjthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sT0FBTixFQUFlLEdBQWYsRUFKRjs7RUFEVzs7cUJBUWIsUUFBQSxHQUFVLFNBQUMsSUFBRDtBQUNSLFFBQUE7SUFBQSxJQUFVLElBQUMsQ0FBQSxjQUFYO0FBQUEsYUFBQTs7SUFFQSxZQUFBLEdBQWUsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFBO1FBQ2IsT0FBTyxDQUFDLEdBQVIsQ0FBWSxpQkFBWjtRQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sTUFBTjtlQUVBLElBQUEsQ0FBQTtNQUphO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtJQU1mLElBQUMsQ0FBQSxjQUFELEdBQWtCO1dBQ2xCLFlBQUEsQ0FBQTtFQVZROztxQkFhVixHQUFBLEdBQUssU0FBQTtXQUNILEtBQUssQ0FBQyxPQUFOLENBQWMsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFDLElBQUQ7UUFDWixJQUFHLEtBQUMsQ0FBQSxjQUFKO1VBQ0UsS0FBQyxDQUFBLHdCQUFELENBQTBCLGdCQUExQjtBQUNBLGlCQUFPLElBQUEsQ0FBSyxJQUFJLFlBQVksQ0FBQyxhQUFqQixDQUFBLENBQUwsRUFGVDs7UUFJQSxLQUFDLENBQUEsd0JBQUQsQ0FBMEIsY0FBMUI7ZUFFQSxLQUFDLENBQUEsS0FBSyxDQUFDLGdCQUFQLENBQXdCLFNBQUMsR0FBRCxFQUFNLE1BQU47VUFDdEIsSUFBRyxXQUFIO1lBQ0UsS0FBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiO0FBQ0EsbUJBQU8sVUFBQSxDQUFXLElBQVgsRUFBaUIsS0FBQyxDQUFBLFlBQWxCLEVBRlQ7O1VBSUEsSUFBTyxjQUFQO0FBQ0UsbUJBQU8sVUFBQSxDQUFXLElBQVgsRUFBaUIsS0FBQyxDQUFBLFlBQWxCLEVBRFQ7O0FBR0EsaUJBQU8sSUFBQSxDQUFBO1FBUmUsQ0FBeEI7TUFQWTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBZCxFQWdCRSxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUMsR0FBRDtlQUNBLEtBQUMsQ0FBQSxXQUFELENBQWEsR0FBYjtNQURBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWhCRjtFQURHOztxQkFvQkwsd0JBQUEsR0FBMEIsU0FBQyxNQUFEO0lBQ3hCLElBQUcsSUFBQyxDQUFBLFlBQUQsS0FBbUIsTUFBdEI7TUFDRSxJQUFDLENBQUEsWUFBRCxHQUFnQjthQUNoQixJQUFDLENBQUEsSUFBRCxDQUFNLE1BQU4sRUFGRjs7RUFEd0I7Ozs7R0FyREw7O0FBMER2QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbImFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKVxuXG5FdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcblF1ZXVlckVycm9ycyA9IHJlcXVpcmUoJy4vZXJyb3JzJylcbnsgSEVBTFRIWV9TVEFUVVMsIFVOSEVBTFRIWV9TVEFUVVMgfSA9IHJlcXVpcmUoJy4vaGVhbHRoY2hlY2tfc3RhdHVzZXMnKVxuXG5jbGFzcyBXYXRjaGRvZyBleHRlbmRzIEV2ZW50RW1pdHRlclxuICBjb25zdHJ1Y3RvcjogKE1vZGVsLCB7IEBwb2xsSW50ZXJ2YWwgPSA1MDAgfSA9IHt9KSAtPlxuICAgIHRocm93IG5ldyBFcnJvcihcIidNb2RlbCcgbXVzdCBiZSBwYXNzZWQgdG8gTW9uZ29RdWV1ZXIuV2F0Y2hkb2cgY29uc3RydWN0b3JcIikgdW5sZXNzIE1vZGVsP1xuICAgIHRocm93IG5ldyBFcnJvcihcIidNb2RlbCcgbXVzdCB1c2UgdGhlIE1vbmdvUXVldWVyLlRhc2tQbHVnaW5cIikgdW5sZXNzIE1vZGVsLl9tb25nb1F1ZXVlck9wdGlvbnM/XG5cbiAgICAjIFBhcmFtc1xuICAgIEBNb2RlbCA9IE1vZGVsXG5cbiAgICAjIEludGVybmFsIHN0YXRlXG4gICAgQGlzU2h1dHRpbmdEb3duID0gZmFsc2VcblxuICAjIEVycm9yIG5vdGlmaWNhdGlvbnNcbiAgbm90aWZ5RXJyb3I6IChlcnIpIC0+XG4gICAgaWYgZXJyIGluc3RhbmNlb2YgUXVldWVyRXJyb3JzLlNodXRkb3duRXJyb3JcbiAgICAgIGNvbnNvbGUubG9nICdQcm9jZXNzIGdvbmUgaW50byBzaHV0ZG93biBtb2RlLiBOb3QgcG9sbGluZyBhbnltb3JlLidcbiAgICBlbHNlXG4gICAgICBjb25zb2xlLmxvZyBlcnJcbiAgICAgIEBlbWl0ICdlcnJvcicsIGVyclxuXG4gICMgU2h1dGRvd25cbiAgc2h1dGRvd246IChkb25lKSAtPlxuICAgIHJldHVybiBpZiBAaXNTaHV0dGluZ0Rvd25cblxuICAgIF9jbGVhbmVkVXBGbiA9ICgpID0+XG4gICAgICBjb25zb2xlLmxvZyAnV29ya2VyIHF1aXR0aW5nJ1xuICAgICAgQGVtaXQgJ3F1aXQnXG5cbiAgICAgIGRvbmUoKVxuXG4gICAgQGlzU2h1dHRpbmdEb3duID0gdHJ1ZVxuICAgIF9jbGVhbmVkVXBGbigpXG5cbiAgIyBGZXRjaCB0YXNrc1xuICBydW46ICgpIC0+XG4gICAgYXN5bmMuZm9yZXZlciAoZG9uZSkgPT5cbiAgICAgIGlmIEBpc1NodXR0aW5nRG93blxuICAgICAgICBAbm90aWZ5SGVhbHRoU3RhdHVzQ2hhbmdlIFVOSEVBTFRIWV9TVEFUVVNcbiAgICAgICAgcmV0dXJuIGRvbmUgbmV3IFF1ZXVlckVycm9ycy5TaHV0ZG93bkVycm9yKClcblxuICAgICAgQG5vdGlmeUhlYWx0aFN0YXR1c0NoYW5nZSBIRUFMVEhZX1NUQVRVU1xuXG4gICAgICBATW9kZWwuX2ZhaWxUaW1lZE91dE9uZSAoZXJyLCBvYmplY3QpID0+XG4gICAgICAgIGlmIGVycj9cbiAgICAgICAgICBAbm90aWZ5RXJyb3IgZXJyXG4gICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQgZG9uZSwgQHBvbGxJbnRlcnZhbFxuXG4gICAgICAgIHVubGVzcyBvYmplY3Q/XG4gICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQgZG9uZSwgQHBvbGxJbnRlcnZhbFxuXG4gICAgICAgIHJldHVybiBkb25lKClcbiAgICAsIChlcnIpID0+XG4gICAgICBAbm90aWZ5RXJyb3IgZXJyXG5cbiAgbm90aWZ5SGVhbHRoU3RhdHVzQ2hhbmdlOiAoc3RhdHVzKSAtPlxuICAgIGlmIEBoZWFsdGhTdGF0dXMgaXNudCBzdGF0dXNcbiAgICAgIEBoZWFsdGhTdGF0dXMgPSBzdGF0dXNcbiAgICAgIEBlbWl0IHN0YXR1c1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdhdGNoZG9nXG4iXX0=
