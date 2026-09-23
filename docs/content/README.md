# docs/content/

**The words.** What the interface calls things, how it addresses a person, and what it says when something is wrong or when there is nothing to show.

Content rules are the part of the system that a designer cannot fix in Figma and a developer cannot fix in CSS. They are also the part a person actually reads. What form a message takes — inline, toast or dialog — belongs in [`behavior/feedback.md`](../behavior/feedback.md). What the message says belongs here.

Written to the grammar in [`docs/RULES.md`](../RULES.md); rules here carry `CNT-` IDs. `npm run validate:rules` checks that this table and the files agree.

| File | Status |
| --- | --- |
| [voice.md](voice.md) | Yet to fill |
| [capitalization.md](capitalization.md) | Yet to fill |
| [terminology.md](terminology.md) | Yet to fill |
| [labels.md](labels.md) | Yet to fill |
| [errors.md](errors.md) | Yet to fill |
| [empty-states.md](empty-states.md) | Yet to fill |
| [help.md](help.md) | Yet to fill |
| [formats.md](formats.md) | Yet to fill |

**Every file is a scope line and nothing else**, and says so in its status. SPEC 0013 created the complete set, with every file empty. Having a file for the system's voice does not mean the voice is settled.
