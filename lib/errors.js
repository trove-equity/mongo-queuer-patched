var ShutdownError,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ShutdownError = (function(superClass) {
  extend(ShutdownError, superClass);

  function ShutdownError() {
    ShutdownError.__super__.constructor.call(this, "Going into shutdown.");
  }

  return ShutdownError;

})(Error);

module.exports = {
  ShutdownError: ShutdownError
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9lcnJvcnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUEsYUFBQTtFQUFBOzs7QUFBTTs7O0VBQ1MsdUJBQUE7SUFDWCwrQ0FBTSxzQkFBTjtFQURXOzs7O0dBRGE7O0FBSzVCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7RUFBQSxhQUFBLEVBQWUsYUFBZiIsImZpbGUiOiJsaWIvZXJyb3JzLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgU2h1dGRvd25FcnJvciBleHRlbmRzIEVycm9yXG4gIGNvbnN0cnVjdG9yOiAoKSAtPlxuICAgIHN1cGVyIFwiR29pbmcgaW50byBzaHV0ZG93bi5cIlxuXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgU2h1dGRvd25FcnJvcjogU2h1dGRvd25FcnJvclxuIl19
