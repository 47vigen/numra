---
"raqam": patch
---

Document the public React surface with JSDoc that ships in the type
declarations. `NumberField` and each of its twelve parts, plus
`useNumberFieldState` and `useNumberField`, now carry composition rules and
runnable examples — so editor hover and any tool reading
`node_modules/raqam/dist/*.d.ts` gets the API without a network round-trip.
Types only; no runtime change.
