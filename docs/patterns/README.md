# docs/patterns/

**One decided answer per recurring task.** A form, a table, a filter row, a wizard: work that every product does, solved once here so that it is not re-solved differently in each screen that needs it.

A pattern composes [`behavior/`](../behavior/README.md) and [`foundations/`](../foundations/README.md) rather than restating them — it says which of the available options this system takes, and cites the rule it is choosing among ([RULES.md](../RULES.md) RUL-11, RUL-12). A pattern is not a component: it can name several, and a component can appear in several patterns.

Written to the grammar in [`docs/RULES.md`](../RULES.md); rules here carry `PAT-` IDs. `npm run validate:rules` holds this table and the files in agreement.

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

**Every file is a scope line and nothing else**, and says so in its status. The set was created complete and empty by [SPEC 0013](../specs/0013-guideline-structure.md); what each pattern decides is settled per topic, not here.
