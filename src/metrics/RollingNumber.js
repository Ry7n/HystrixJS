import ActualTime from "../util/ActualTime";
import HystrixConfig from "../util/HystrixConfig";
import Bucket from "./CounterBucket";
import CumulativeSum from "./CumulativeSum";

function resetBucket(bucket) {
    bucket.reset();
}

class RollingNumber {

    constructor({
                timeInMillisecond = HystrixConfig.metricsStatisticalWindowInMilliseconds,
                numberOfBuckets = HystrixConfig.metricsStatisticalWindowBuckets
            } = {}) {
        this.windowLength = timeInMillisecond;
        this.numberOfBuckets = numberOfBuckets;
        this.bucketSizeInMilliseconds = timeInMillisecond / numberOfBuckets;
        const buckets = this.buckets = new Array(numberOfBuckets);
        for (let i = 0; i < numberOfBuckets; i += 1) {
            buckets[i] = new Bucket(-Infinity);
        }
        this.bucketIndex = numberOfBuckets - 1;
        this.cumulativeSum = new CumulativeSum();
    }

    increment(type) {
        this.getCurrentBucket().increment(type);
    }

    getCurrentBucket() {
        const currentTime = ActualTime.getCurrentTime();

        const currentBucket = this.buckets[this.bucketIndex];
        const windowStart = currentBucket.windowStart;
        if (currentTime > (windowStart + this.windowLength)) {
            this.reset();
            return this.getCurrentBucket();
        }
        if (currentTime < (windowStart + this.bucketSizeInMilliseconds)) {
            return currentBucket;
        } else {
            this.rollWindow(currentTime);
            return this.getCurrentBucket();
        }
    }

    rollWindow(currentTime) {
        let bucketIndex = this.bucketIndex;
        const buckets = this.buckets;
        let currentBucket = buckets[bucketIndex];
        if (currentBucket) {
            this.cumulativeSum.addBucket(currentBucket);
        }

        bucketIndex += 1;
        if (bucketIndex === this.numberOfBuckets) {
            bucketIndex = 0;
        }
        this.bucketIndex = bucketIndex;

        const newBucket = buckets[bucketIndex];
        newBucket.windowStart = currentTime;
        newBucket.reset();
    }

    getRollingSum(type) {
        return this.buckets.reduce((reduction, bucket) => reduction + bucket.get(type), 0);
    }

    getCumulativeSum(type) {
        return this.getCurrentBucket().get(type) + this.cumulativeSum.get(type);
    }

    reset() {
        const currentBucket = this.buckets[this.bucketIndex];
        this.cumulativeSum.addBucket(currentBucket);
        this.buckets.forEach(resetBucket);
        this.bucketIndex = 0;
    }
}

export default RollingNumber;
