import {Factory as CommandMetricsFactory} from "../metrics/CommandMetrics";
import CircuitBreakerFactory from "./CircuitBreaker";
import ActualTime from "../util/ActualTime"
import HystrixConfig from "../util/HystrixConfig";

function doFinally(promise, fn) {
    return promise.then(
        res => {
            fn();
            return res;
        },
        err => {
            fn();
            throw err;
        }
    );
}

function timeout(PromiseClass, promisedValue, timeMs) {

    return new PromiseClass((resolve, reject) => {
        let timer = setTimeout(() => reject(new Error('CommandTimeOut')), timeMs);

        return doFinally(promisedValue.then(resolve, reject),
            () => clearTimeout(timer));
    });

}

export default class Command {
    constructor({
            commandKey,
            commandGroup,
            runContext,
            metricsConfig,
            circuitConfig,
            requestVolumeRejectionThreshold = HystrixConfig.requestVolumeRejectionThreshold,
            timeout = HystrixConfig.executionTimeoutInMilliseconds,
            fallback = err => Promise.reject(err),
            run = function() {throw new Error("Command must implement run method.")},
            isErrorHandler = function(error) {return error;}
        }) {
        this.commandKey = commandKey;
        this.commandGroup = commandGroup;
        this.run = run;
        this.runContext = runContext;
        this.fallback = fallback;
        this.timeout = timeout;
        this.isError = isErrorHandler;
        this.metricsConfig = metricsConfig;
        this.circuitConfig = circuitConfig;
        this.requestVolumeRejectionThreshold = requestVolumeRejectionThreshold;
        this.Promise = HystrixConfig.promiseImplementation;
    }

    get circuitBreaker() {
        return CircuitBreakerFactory.getOrCreate(this.circuitConfig);
    }

    get metrics() {
        return CommandMetricsFactory.getOrCreate(this.metricsConfig);
    }

    execute() {
        //Resolve promise to guarantee execution/fallback is always deferred
        return this.Promise.resolve()
            .then(() => {
                if (this.requestVolumeRejectionThreshold != 0 && this.metrics.getCurrentExecutionCount() >= this.requestVolumeRejectionThreshold) {
                    return this.handleFailure(new Error("CommandRejected"));
                }
                if (this.circuitBreaker.allowRequest()) {
                    return this.runCommand.apply(this, arguments);
                } else {
                    this.metrics.markShortCircuited();
                    return this.fallback(new Error("OpenCircuitError"));
                }
            });
    }

    runCommand() {
        this.metrics.incrementExecutionCount();
        let start = ActualTime.getCurrentTime();
        let commandPromise = this.run.apply(this.runContext, arguments);
        if (this.timeout > 0) {
            commandPromise = timeout(this.Promise, commandPromise, this.timeout);
        }
        commandPromise = commandPromise.then(
                (res) => {
                    this.handleSuccess(start);
                    return res
                }
            )
            .catch(err => this.handleFailure(err));

        return doFinally(commandPromise, () => this.metrics.decrementExecutionCount());
    }

    handleSuccess(start) {
        let end = ActualTime.getCurrentTime();
        this.metrics.addExecutionTime(end - start);
        this.metrics.markSuccess();
        this.circuitBreaker.markSuccess();
    }

    handleFailure(err) {
        if (this.isError(err)) {
            if (err.message === "CommandTimeOut") {
                this.metrics.markTimeout();
            } else if (err.message === "CommandRejected") {
                this.metrics.markRejected();
            } else {
                this.metrics.markFailure();
            }
        }

        return this.fallback(err);
    }
}
