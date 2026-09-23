# docs/patterns/

**One decided answer per recurring task.** A form, a table, a filter row, a wizard: work that every product does. Each is solved once here, so that a screen that needs it does not solve it again in a different way.

A pattern combines [`behavior/`](../behavior/README.md) and [`foundations/`](../foundations/README.md) rather than restating them. It says which of the available options this system takes, and cites the rule whose options it is choosing from ([RULES.md](../RULES.md) RUL-11, RUL-12). A pattern is not a component: one pattern can name several components, and one component can appear in several patterns.

Written to the grammar in [`docs/RULES.md`](../RULES.md); rules here carry `PAT-` IDs. `npm run validate:rules` checks that this table and the files agree.

| File | Status |
| --- | --- |
| [forms.md](forms.md) | Yet to fill |
| [tables.md](tables.md) | Yet to fill |
| [filtering.md](filtering.md) | Yet to fill |
| [sorting.md](sorting.md) | Yet to fill |
| [search.md](search.md) | Yet to fill |
| [navigation.md](navigation.md) | Yet to fill |
| [wizard.md](wizard.md) | Yet to fill |
| [settings.md](settings.md) | Yet to fill |
| [dialogs.md](dialogs.md) | Yet to fill |
| [notifications.md](notifications.md) | Yet to fill |
| [bulk-actions.md](bulk-actions.md) | Yet to fill |
| [code-editor.md](code-editor.md) | Yet to fill |
| [first-run.md](first-run.md) | Yet to fill |
| [shortcuts.md](shortcuts.md) | Yet to fill |
| [error-pages.md](error-pages.md) | Yet to fill |

**Every file is a scope line and nothing else**, and says so in its status. SPEC 0013 created the complete set, with every file empty. What each pattern decides is settled for each topic separately, not here.
