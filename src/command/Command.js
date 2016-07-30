import {Factory as CommandMetricsFactory} from "../metrics/CommandMetrics";
import CircuitBreakerFactory from "./CircuitBreaker";
import ActualTime from "../util/ActualTime"
import HystrixConfig from "../util/HystrixConfig";

function reject(error) {
    return new global.Promise((resolve, reject) => reject(error));
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
            fallback = reject,
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
    }

    get circuitBreaker() {
        return CircuitBreakerFactory.getOrCreate(this.circuitConfig);
    }

    get metrics() {
        return CommandMetricsFactory.getOrCreate(this.metricsConfig);
    }

    execute() {
        if (this.requestVolumeRejectionThreshold != 0 && this.metrics.getCurrentExecutionCount() >= this.requestVolumeRejectionThreshold) {
            return this.handleFailure(new Error("CommandRejected"));
        }
        if (this.circuitBreaker.allowRequest()) {
            return this.runCommand.apply(this, arguments);
        } else {
            this.metrics.markShortCircuited();
            return this.fallback(new Error("OpenCircuitError"));
        }
    }

    runCommand() {
        this.metrics.incrementExecutionCount();
        let start = ActualTime.getCurrentTime();
        let promise = this.run.apply(this.runContext, arguments);
        if (this.timeout > 0) {
            promise = promise.timeout(this.timeout, "CommandTimeOut");
        }

        return promise
        .then(
            (res) => {
                this.handleSuccess(start);
                return res
            }
        )
        .then(null, err => this.handleFailure(err))
        .then(res => {
            this.metrics.decrementExecutionCount();
            return res;
        }, err => {
            this.metrics.decrementExecutionCount();
            throw err;
        });
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
