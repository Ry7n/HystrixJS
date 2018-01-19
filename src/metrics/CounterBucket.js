import RollingNumberEvent from "./RollingNumberEvent";

const initalvalues = Object.keys(RollingNumberEvent).
    map((key) => [RollingNumberEvent[key], 0]);

export default class CounterBucket {

    constructor (windowStart) {
        this.windowStart = windowStart;
        this.bucketValues = new Map(initalvalues);
    }

    get(type) {
        const bucketValues = this.bucketValues;
        if (!bucketValues.has(type)) {
            throw new Error("invalid event");
        }
        return this.bucketValues.get(type);
    }

    increment(type) {
        const bucketValues = this.bucketValues;
        if (!bucketValues.has(type)) {
            throw new Error("invalid event");
        }
        const value = bucketValues.get(type);
        bucketValues.set(type, value + 1);
    }

    reset() {
        const bucketValues = this.bucketValues;
        initalvalues.forEach(([key, value]) => bucketValues.set(key, value));
    }
}