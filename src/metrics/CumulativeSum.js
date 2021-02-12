import RollingNumberEvent from "./RollingNumberEvent";

const initalvalues = Object.keys(RollingNumberEvent).
    map((key) => [RollingNumberEvent[key], 0]);

class CumulativeSum {

    constructor() {
        this.values = new Map(initalvalues);
    }

    addBucket(lastBucket) {
        this.values.forEach((value, key, map) => {
            map.set(key, value + lastBucket.get(key));
        });
    }

    get(type) {
        const values = this.values;
        if (!values.has(type)) {
            throw new Error("invalid event");
        }
        return values.get(type);
    }
}

export default CumulativeSum;
