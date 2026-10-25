# Input Text — native types, 2026-10-25

The owner approved exposing native text-like input types while deferring any
new decision about dedicated Password/Email components.

## Contract and implementation

- Add type with text as its default; supported values are text, password,
  email, tel and url. The generated TypeScript union, Storybook Controls and
  independent HTML preview follow the registry vocabulary.
- Bind type on the existing native input. Keep the same field structure,
  string binding, Label, descriptions, focus effects and form attributes.
  No type-specific branch, extra wrapper, action or reveal control is added.
- Native browser value handling and validity follow the selected type. Visual
  validation remains consumer-supplied. Text-like masking no longer requires
  changing the internal input's type from a consumer action.
- Remove the contract's direction to unimplemented Password/Email inventory
  entries for these native cases. Input Text stays ready. The web-only type
  property creates no additional Figma variants; dedicated-type component
  boundaries remain open.

## Verification

- Repository tests pass: 52 test files. Preview coverage checks every supported
  native type, preserved form attributes and compact hierarchy, and rejection
  of unsupported number/checkbox/file/date/search assignments.
- Registry validation and CSS lint pass. Existing 192 registry judgement
  reports remain. Svelte reports zero errors and zero warnings; documentation,
  package and Storybook production builds pass.
- Packaged UI verification passes for 46 core components and 3,320 SSR cases.
- Chromium's Default playground maps all five choices to the native type.
  A medium plain labelled field keeps four DOM elements and a 40-unit input
  height. A typed sample remains available when switched back to text.
- The native form fixture confirms text/password round trips retain the
  typed sample and masked submission includes the expected token form value.
  Native reset restores the initial value; a disabled fieldset disables input.
- Email and URL report native typeMismatch for the token-shaped sample, and
  accept person@example.test and https://example.test/path respectively.
- The password example visibly renders masked characters using native browser
  behaviour. Verification uses synthetic samples only.

These are targeted Chromium and packaged checks. Broader browser,
screen-reader and release acceptance remain in [0.3.0](0.3.0.md).
