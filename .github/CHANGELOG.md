# ChangeLog

## [2.1.0] - 03-08-2020

- chore: upgrade supported Deno and std module versions to `1.2.2` and `0.63.0`.
- chore: fix modules to tagged versions as [commits and branches are no longer supported by Deno registry](https://deno.land/posts/registry2).
- chore: automate typescript docs

## [2.0.0] - 16-07-2020

- feat: update to Deno `1.2.0` (breaking upgrade), std `0.61.0` and other dep upgrades.
- tests: add patch for dispatcher bug in Deno, REF: <https://github.com/denoland/deno/issues/6616>.
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
