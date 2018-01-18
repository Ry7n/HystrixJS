"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _utilActualTime = require("../util/ActualTime");

var _utilActualTime2 = _interopRequireDefault(_utilActualTime);

var _utilHystrixConfig = require("../util/HystrixConfig");

var _utilHystrixConfig2 = _interopRequireDefault(_utilHystrixConfig);

var _CounterBucket = require("./CounterBucket");

var _CounterBucket2 = _interopRequireDefault(_CounterBucket);

var _CumulativeSum = require("./CumulativeSum");

var _CumulativeSum2 = _interopRequireDefault(_CumulativeSum);

var RollingNumber = (function () {
    function RollingNumber() {
        var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var _ref$timeInMillisecond = _ref.timeInMillisecond;
        var timeInMillisecond = _ref$timeInMillisecond === undefined ? _utilHystrixConfig2["default"].metricsStatisticalWindowInMilliseconds : _ref$timeInMillisecond;
        var _ref$numberOfBuckets = _ref.numberOfBuckets;
        var numberOfBuckets = _ref$numberOfBuckets === undefined ? _utilHystrixConfig2["default"].metricsStatisticalWindowBuckets : _ref$numberOfBuckets;

        _classCallCheck(this, RollingNumber);

        this.windowLength = timeInMillisecond;
        this.numberOfBuckets = numberOfBuckets;
        this.bucketSizeInMilliseconds = timeInMillisecond / numberOfBuckets;
        var buckets = this.buckets = new Array(numberOfBuckets);
        for (var i = 0; i < numberOfBuckets; i += 1) {
            buckets[i] = new _CounterBucket2["default"](-Infinity);
        }
        this.bucketIndex = numberOfBuckets - 1;
        this.cumulativeSum = new _CumulativeSum2["default"]();
    }

    _createClass(RollingNumber, [{
        key: "increment",
        value: function increment(type) {
            this.getCurrentBucket().increment(type);
        }
    }, {
        key: "getCurrentBucket",
        value: function getCurrentBucket() {
            var currentTime = _utilActualTime2["default"].getCurrentTime();

            var currentBucket = this.buckets[this.bucketIndex];
            var windowStart = currentBucket.windowStart;
            if (currentTime > windowStart + this.windowLength) {
                this.reset(currentTime);
                return this.getCurrentBucket();
            }
            if (currentTime < windowStart + this.bucketSizeInMilliseconds) {
                return currentBucket;
            } else {
                this.rollWindow(currentTime);
                return this.getCurrentBucket();
            }
        }
    }, {
        key: "rollWindow",
        value: function rollWindow(currentTime) {
            var bucketIndex = this.bucketIndex;
            var buckets = this.buckets;
            var currentBucket = buckets[bucketIndex];
            if (currentBucket) {
                this.cumulativeSum.addBucket(currentBucket);
            }

            bucketIndex += 1;
            if (bucketIndex === this.numberOfBuckets) {
                bucketIndex = 0;
            }
            this.bucketIndex = bucketIndex;

            var newBucket = buckets[bucketIndex];
            newBucket.windowStart = currentTime;
            newBucket.reset();
        }
    }, {
        key: "getRollingSum",
        value: function getRollingSum(type) {
            return this.buckets.reduce(function (reduction, bucket) {
                return reduction + bucket.get(type);
            }, 0);
        }
    }, {
        key: "getCumulativeSum",
        value: function getCumulativeSum(type) {
            return this.getCurrentBucket().get(type) + this.cumulativeSum.get(type);
        }
    }, {
        key: "reset",
        value: function reset(currentTime) {
            var currentBucket = this.buckets[this.bucketIndex];
            this.cumulativeSum.addBucket(currentBucket);
            this.buckets.forEach(function (bucket) {
                bucket.windowStart = currentTime;
                bucket.reset();
            });
            this.bucketIndex = 0;
        }
    }]);

    return RollingNumber;
})();

exports["default"] = RollingNumber;
module.exports = exports["default"];