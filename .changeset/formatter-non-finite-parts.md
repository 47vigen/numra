---
"raqam": patch
---

`formatToParts` and `formatResult` now render non-finite values as nothing,
matching `format`. Previously `format(NaN)` returned `""` while
`formatResult(NaN).formatted` returned `"NaN"` — and a configured
`prefix`/`suffix` was wrapped around it. Only reachable through `raqam/core`
directly; the React bindings never format a non-finite value.
