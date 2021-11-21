# ChangeLog

## [4.7.1] - 21-11-2021

- feat: add `console.error` logging for errors thrown by provided app handler to help debugging.

## [4.7.0] - 21-11-2021

- feat: support Deno `1.16.2` and std `0.115.1` and other deps upgrades
- fix: improved `Server` determination

## [4.6.1] - 05-11-2021

- [#36] fix: process FormData correctly (#37) @c0per
- feat: Support Deno `1.15.3` and std `0.113.0` and other deps upgrades

## [4.6.0] - 04-10-2021

- deps: bump deps and replace std@0.106 with http_legacy.ts (#34) 
- ci: support Deno `1.14.2` in CI
- ci: bump `eggs` CLI to `0.3.9`

## [4.5.0] - 21-09-2021

- feat: Support Deno `1.14.0` and std `0.107.0` and other deps upgrades

## [4.4.0] - 13-07-2021

- feat: Support Deno `1.12.0` and std `0.101.0` and other deps upgrades

## [4.3.0] - 25-06-2021

- feat: Support Deno `1.11.2` and std `0.99.0` and other deps upgrades
- test: fix leaky test
- ci: enable linting

## [4.2.1] - 26-04-2021

- deps: upgrade Opine to `1.3.3`

## [4.2.0] - 26-04-2021

- [#27] Deno ^1.9.0 Fixes (#29)

## [4.1.0] - 06-03-2021

- feat: Support Deno 1.8.0 and std 0.89.0
- chore: upgrade dependencies

## [4.0.0] - 10-02-2021

- refactor: use JSPM production url for superagent
- [#25] Use Deno.inspect instead of npm package (#26)
- docs: fix up docs to ease contributions

## [3.1.1] - 10-02-2021

- feat: `await` the closing of the server to aid consumers in avoiding leaking
  async ops when performing async cleanup.

## [3.1.0] - 09-02-2021

- fix: override superagent's `getXHR` method to prevent need to supply
  superfluous `--location <href>` flag.

## [3.0.0] - 12-12-2020

- feat: **BREAKING CHANGE** support
  [superagent `.redirects(n)` API](https://visionmedia.github.io/superagent/#following-redirects),
  with a default of `0`.

The consequence of supporting the `.redirects(n)` API is that superdeno follows
a default of `0` redirects, for parity with
[supertest](https://github.com/visionmedia/supertest/blob/master/lib/test.js#L32).
If your test requires superdeno to follow multiple redirects, specify the number
of redirects required in `.redirects(n)`, or use `-1` to have superdeno follow
all redirects.

## [2.5.0] - 10-12-2020

- feat: update to Deno `1.6.0`, std `0.80.0` and other dep upgrades.

## [2.4.1] - 07-12-2020

- fix: improve types, including `res.header` and `res.headers`.

## [2.4.0] - 06-12-2020

- feat: update to Deno `1.5.4`, std `0.79.0` and other dep upgrades.
- fix: incorrect type for `.expect()` signature.

## [2.3.2] - 19-09-2020

- chore: upgrade to eggs@0.2.2 in CI

## [2.3.1] - 19-09-2020

- feat: update to Deno `1.4.1`, std `0.70.0` and other dep upgrades.

## [2.3.0] - 15-09-2020

- feat: update to Deno `1.4.0`, std `0.69.0` and other dep upgrades.

## [2.2.1] - 24-08-2020

- feat: update to Deno `1.3.1`, std `0.66.0` and other dep upgrades.
- fix: [#15] Error thrown on empty body responses (e.g. 304)

## [2.2.0] - 21-08-2020

- feat: update to Deno `1.3.0`, std `0.65.0` and other dep upgrades.
- test: add MacOS and Windows testing to GitHub Actions test workflow.

## [2.1.1] - 04-08-2020

- chore: fix eggs link workflow.

## [2.1.0] - 03-08-2020

- chore: upgrade supported Deno and std module versions to `1.2.2` and `0.63.0`.
- chore: fix modules to tagged versions as
  [commits and branches are no longer supported by Deno
  registry](https://deno.land/posts/registry2).
- chore: automate typescript docs

## [2.0.0] - 16-07-2020

- feat: update to Deno `1.2.0` (breaking upgrade), std `0.61.0` and other dep
  upgrades.
- tests: add patch for dispatcher bug in Deno, REF:
  <https://github.com/denoland/deno/issues/6616>.
- chore: update formatting.

## [1.6.1] - 06-07-2020

- fix: SuperDeno should permit and handle GET requests with body payloads.

## [1.6.0] - 06-07-2020

- feat: bump deno and deps versions.
- refactor: small updates to xhrSham.
- test: add Ako framework test for error response status and body.

## [1.5.1] - 02-07-2020

- fix: breaking sub-dependency change.

## [1.5.0] - 29-06-2020

- fix: handling of multiple values for the same header field.
- feat: upgrade to Deno 1.1.2 and std 0.59.0.
- fix: typing issues.

## [1.4.0] - 23-06-2020

- feat: support `app.handle()` from Oak.
- chore: update dependencies.

## [1.3.0] - 21-06-2020

- fix: relax `RequestHandler` type.
- feat: bump std and opine versions.

## [1.2.1] - 19-06-2020

- chore: readme image size.

## [1.2.0] - 19-06-2020

- fix: 4xx and 5xx http status codes should not throw.

## [1.1.5] - 19-06-2020

- feat: add repository to `egg.json`.

## [1.1.4] - 18-06-2020

- fix: egg.json
- feat: add icon artist attribution.

## [1.1.3] - 18-06-2020

- feat: move to main default branch.
- fix: pull request template.
- feat: support <https://nest.land> package registry.
- feat: bump Deno version support to 1.1.0.

## [1.1.2] - 01-06-2020

- fix: sub-resource integrity check failed --lock=lock.json.

## [1.1.1] - 01-06-2020

- docs: minor inline documentation and types improvements to appease deno docs.

## [1.1.0] - 01-06-2020

- docs: improve inline documentation and types.

## [1.0.0] - 31-05-2020

- feat: initial port of supertest.
