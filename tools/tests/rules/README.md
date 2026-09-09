# tools/tests/rules/

Fixtures for `tools/validate-rules.test.mjs`. Each file is a guideline document
that is wrong in exactly one way, named for the way it is wrong, so that a test
proving the validator catches something reads against a document a person can
check by eye.

They are `.md` files carrying rule IDs on purpose, which is why
`validate-rules.mjs` skips `tools/tests/` when it looks for citations: a fixture
citing a rule that does not exist is the fixture working.
