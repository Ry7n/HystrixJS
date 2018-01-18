"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _RollingNumberEvent = require("./RollingNumberEvent");

var _RollingNumberEvent2 = _interopRequireDefault(_RollingNumberEvent);

var initalvalues = Object.keys(_RollingNumberEvent2["default"]).map(function (key) {
    return [_RollingNumberEvent2["default"][key], 0];
});

var CounterBucket = (function () {
    function CounterBucket(windowStart) {
        _classCallCheck(this, CounterBucket);

        this.windowStart = windowStart;
        this.bucketValues = new Map(initalvalues);
    }

    _createClass(CounterBucket, [{
        key: "get",
        value: function get(type) {
            var bucketValues = this.bucketValues;
            if (!bucketValues.has(type)) {
                throw new Error("invalid event");
            }
            return this.bucketValues.get(type);
        }
    }, {
        key: "increment",
        value: function increment(type) {
            var bucketValues = this.bucketValues;
            if (!bucketValues.has(type)) {
                throw new Error("invalid event");
            }
            var value = bucketValues.get(type);
            bucketValues.set(type, value + 1);
        }
    }, {
        key: "reset",
        value: function reset() {
            var bucketValues = this.bucketValues;
            initalvalues.forEach(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2);

                var key = _ref2[0];
                var value = _ref2[1];
                return bucketValues.set(key, value);
            });
        }
    }]);

    return CounterBucket;
})();

exports["default"] = CounterBucket;
module.exports = exports["default"];