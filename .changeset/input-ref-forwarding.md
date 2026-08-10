---
"raqam": patch
---

`NumberField.Input` now populates a consumer `ref`. It was declared with
`forwardRef` but ignored the forwarded ref, assigning only the internal caret
ref — so `<NumberField.Input ref={myRef} />` type-checked and left `myRef.current`
null forever. The consumer ref is merged alongside the internal one, so focus and
selection work without unwiring caret control or scrubbing.
