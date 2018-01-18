"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _RollingNumberEvent = require("./RollingNumberEvent");

var _RollingNumberEvent2 = _interopRequireDefault(_RollingNumberEvent);

var initalvalues = Object.keys(_RollingNumberEvent2["default"]).map(function (key) {
    return [_RollingNumberEvent2["default"][key], 0];
});

var CumulativeSum = (function () {
    function CumulativeSum() {
        _classCallCheck(this, CumulativeSum);

        this.values = new Map(initalvalues);
    }

    _createClass(CumulativeSum, [{
        key: "addBucket",
        value: function addBucket(lastBucket) {
            this.values.forEach(function (value, key, map) {
                map.set(key, value + lastBucket.get(key));
            });
        }
    }, {
        key: "get",
        value: function get(type) {
            var values = this.values;
            if (!values.has(type)) {
                throw new Error("invalid event");
            }
            return values.get(type);
        }
    }]);

    return CumulativeSum;
})();

exports["default"] = CumulativeSum;
module.exports = exports["default"];