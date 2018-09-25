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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliL2Vycm9ycy5qcyIsInNvdXJjZXMiOlsibGliL2Vycm9ycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxhQUFBO0VBQUE7OztBQUFNOzs7RUFDUyx1QkFBQTtJQUNYLCtDQUFNLHNCQUFOO0VBRFc7Ozs7R0FEYTs7QUFLNUIsTUFBTSxDQUFDLE9BQVAsR0FDRTtFQUFBLGFBQUEsRUFBZSxhQUFmIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgU2h1dGRvd25FcnJvciBleHRlbmRzIEVycm9yXG4gIGNvbnN0cnVjdG9yOiAoKSAtPlxuICAgIHN1cGVyIFwiR29pbmcgaW50byBzaHV0ZG93bi5cIlxuXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgU2h1dGRvd25FcnJvcjogU2h1dGRvd25FcnJvclxuIl19
