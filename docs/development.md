# Development

Run from this repository, independently of sibling checkouts.

```sh
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run architecture
npm run test
npm run build
npm pack
```

CI runs static checks, build and tests on macOS, Linux and Windows. Local checks do not establish hosted CI success. No publication or release workflow is installed.

Node 24 and npm 11 are required. npm pack includes only dist, README and LICENSE; consumers resolve React as a peer. Core presenters reject stale completions and ignore completion after disposal; ports are injected through constructors. Presenter instances are terminal after disposal. Features own their instance lifetime. No provider calls or engine operations are implemented.
