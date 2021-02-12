import ActualTime from "../util/ActualTime";
import HystrixConfig from "../util/HystrixConfig";
import Bucket from "./PercentileBucket";
import {Stats} from "fast-stats";

export default class RollingPercentile {

    constructor({
                timeInMillisecond = HystrixConfig.metricsPercentileWindowInMilliseconds,
                numberOfBuckets = HystrixConfig.metricsPercentileWindowBuckets
            } = {}) {
        this.windowLength = timeInMillisecond;
        this.numberOfBuckets = numberOfBuckets;
        this.bucketSizeInMilliseconds = this.windowLength / this.numberOfBuckets;
        const buckets = this.buckets = new Array(numberOfBuckets);
        for (let i = 0; i < numberOfBuckets; i += 1) {
            buckets[i] = new Bucket(-Infinity);
        }
        this.bucketIndex = numberOfBuckets - 1;
        this.percentileSnapshot = getPercentileSnapshot();
    }

    addValue(value) {
        this.getCurrentBucket().addValue(value);
    }

    getPercentile(percentile) {
        // TODO: this method accepts either a string or a number, which can cause
        // deoptimization by the complier.
        return this.percentileSnapshot.get(`p${percentile}`);
    }

    getCurrentBucket() {
        let currentTime = ActualTime.getCurrentTime();

        let currentBucket = this.buckets[this.bucketIndex];
        if (currentTime < (currentBucket.windowStart + this.bucketSizeInMilliseconds)) {
            return currentBucket;
        } else {
            this.rollWindow(currentTime);
            return this.getCurrentBucket();
        }
    }

    rollWindow(currentTime) {
        let newBucketIndex = this.bucketIndex + 1;
        if (newBucketIndex === this.numberOfBuckets) {
            newBucketIndex = 0;
        }

        this.percentileSnapshot = getPercentileSnapshot(this.buckets);

        this.bucketIndex = newBucketIndex;
        let newBucket = this.buckets[newBucketIndex];
        newBucket.windowStart = currentTime;
        newBucket.reset();
    }
}

const stats = new Stats();

function pushPercentileBucket(bucket) {
    stats.push(bucket.values);
}

function getPercentileSnapshot(allBuckets = []) {
    allBuckets.forEach(pushPercentileBucket);
    const results = new Map();
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
