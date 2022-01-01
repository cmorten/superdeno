/**
 * Test timeout.
 */
export const TEST_TIMEOUT = 3000;

/**
 * A no-op _describe_ method.
 *
 * @param name
 * @param fn
 */
export function describe(_name: string, fn: () => void | Promise<void>) {
  return fn();
}

export type Done = (err?: unknown) => void;

/**
 * An _it_ wrapper around `Deno.test`.
 *
 * @param name
 * @param fn
 */
export function it(
  name: string,
  fn: (done: Done) => void | Promise<void>,
  options?: Partial<Deno.TestDefinition>,
) {
  Deno.test({
    ...options,
    name,
    fn: async () => {
      let testError: unknown;

      let done: Done = (err?: unknown) => {
        if (err) {
          testError = err;
        }
      };

      let race: Promise<unknown> = Promise.resolve();
      let timeoutId: number;

      if (fn.length === 1) {
        let resolve: (value?: unknown) => void;
        const donePromise = new Promise((r) => {
          resolve = r;
        });

        race = Promise.race([
          new Promise((_, reject) =>
            timeoutId = setTimeout(() => {
              clearTimeout(timeoutId);

              reject(
                new Error(
                  `test "${name}" failed to complete by calling "done" within ${TEST_TIMEOUT}ms.`,
                ),
              );
            }, TEST_TIMEOUT)
          ),
          donePromise,
        ]);

        done = (err?: unknown) => {
          clearTimeout(timeoutId);
          resolve();

          if (err) {
            testError = err;
          }
        };
      }

      await fn(done);
      await race;

      if (timeoutId!) {
        clearTimeout(timeoutId);
      }

      // REF: https://github.com/denoland/deno/blob/987716798fb3bddc9abc7e12c25a043447be5280/ext/timers/01_timers.js#L353
      await new Promise((resolve) => setTimeout(resolve, 20));

      if (testError) {
        throw testError;
      }
    },
  });
}
