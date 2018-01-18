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

var _PercentileBucket = require("./PercentileBucket");

var _PercentileBucket2 = _interopRequireDefault(_PercentileBucket);

var _fastStats = require("fast-stats");

var RollingPercentile = (function () {
    function RollingPercentile() {
        var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var _ref$timeInMillisecond = _ref.timeInMillisecond;
        var timeInMillisecond = _ref$timeInMillisecond === undefined ? _utilHystrixConfig2["default"].metricsPercentileWindowInMilliseconds : _ref$timeInMillisecond;
        var _ref$numberOfBuckets = _ref.numberOfBuckets;
        var numberOfBuckets = _ref$numberOfBuckets === undefined ? _utilHystrixConfig2["default"].metricsPercentileWindowBuckets : _ref$numberOfBuckets;

        _classCallCheck(this, RollingPercentile);

        this.windowLength = timeInMillisecond;
        this.numberOfBuckets = numberOfBuckets;
        this.bucketSizeInMilliseconds = this.windowLength / this.numberOfBuckets;
        var buckets = this.buckets = new Array(numberOfBuckets);
        for (var i = 0; i < numberOfBuckets; i += 1) {
            buckets[i] = new _PercentileBucket2["default"](-Infinity);
        }
        this.bucketIndex = numberOfBuckets - 1;
        this.percentileSnapshot = getPercentileSnapshot();
    }

    _createClass(RollingPercentile, [{
        key: "addValue",
        value: function addValue(value) {
            this.getCurrentBucket().addValue(value);
        }
    }, {
        key: "getPercentile",
        value: function getPercentile(percentile) {
            // TODO: this method accepts either a string or a number, which can cause
            // deoptimization by the complier.
            return this.percentileSnapshot.get("p" + percentile);
        }
    }, {
        key: "getCurrentBucket",
        value: function getCurrentBucket() {
            var currentTime = _utilActualTime2["default"].getCurrentTime();

            var currentBucket = this.buckets[this.bucketIndex];
            if (currentTime < currentBucket.windowStart + this.bucketSizeInMilliseconds) {
                return currentBucket;
            } else {
                this.rollWindow(currentTime);
                return this.getCurrentBucket();
            }
        }
    }, {
        key: "rollWindow",
        value: function rollWindow(currentTime) {
            var newBucketIndex = this.bucketIndex + 1;
            if (newBucketIndex === this.numberOfBuckets) {
                newBucketIndex = 0;
            }

            this.percentileSnapshot = getPercentileSnapshot(this.buckets);

            this.bucketIndex = newBucketIndex;
            var newBucket = this.buckets[newBucketIndex];
            newBucket.windowStart = currentTime;
            newBucket.reset();
        }
    }]);

    return RollingPercentile;
})();

exports["default"] = RollingPercentile;

var stats = new _fastStats.Stats();

function pushPercentileBucket(bucket) {
    stats.push(bucket.values);
}

function getPercentileSnapshot() {
    var allBuckets = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    allBuckets.forEach(pushPercentileBucket);
    var results = new Map();
    results.set("pmean", stats.amean() || 0);
    results.set("p0", stats.percentile(0) || 0);
    results.set("p5", stats.percentile(5) || 0);
    results.set("p10", stats.percentile(10) || 0);
    results.set("p25", stats.percentile(25) || 0);
    results.set("p50", stats.percentile(50) || 0);
    results.set("p75", stats.percentile(75) || 0);
    results.set("p90", stats.percentile(90) || 0);
    results.set("p95", stats.percentile(95) || 0);
    results.set("p99", stats.percentile(99) || 0);
    results.set("p995", stats.percentile(99.5) || 0);
    results.set("p999", stats.percentile(99.9) || 0);
    results.set("p100", stats.percentile(100) || 0);
    stats.reset();
    return results;
}
module.exports = exports["default"];