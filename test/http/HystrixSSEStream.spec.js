'use strict';

const HystrixSSEStream = require("../../lib/http/HystrixSSEStream");
const CommandFactory = require("../../lib/command/CommandFactory");
const CommandMetricsFactory = require("../../lib/metrics/CommandMetrics").Factory;
const q = require("q");

describe("HystrixSSEStream", function() {

    beforeEach(function() {
        CommandFactory.resetCache();
        CommandMetricsFactory.resetCache();
    });

    function executeCommand(commandKey, timeout = 0) {
        const run = function(arg) {
            return q.Promise(function(resolve, reject, notify) {
                setTimeout(function() {
                    resolve(arg);
                }, timeout)
            });
        };

        const command = CommandFactory.getOrCreate(commandKey)
            .run(run)
            .build();

        return command.execute("success");
    }

    describe("toObservable", () => {
        it("should return json string metrics", (done) => {
            executeCommand("HystrixSSECommand1", 0)
              .then(() =>
                  HystrixSSEStream.toObservable(0)
                      .first()
                      .map(JSON.parse)
                      .subscribe(
                          metrics => {
                              expect(metrics.type).toBe("HystrixCommand");
                              expect(metrics.name).toBe("HystrixSSECommand1");
                              expect(metrics.isCircuitBreakerOpen).toBeFalsy();
                          },
                          e => {
                              fail(e);
                              done();
                          },
                          done
                      )
              );
        });
    });
});
