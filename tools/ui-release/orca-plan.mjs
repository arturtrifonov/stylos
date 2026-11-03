// The Linux Chrome + Orca walkthrough for 0.3.0 acceptance (packages/ui/verification/0.3.0.md).
// One scenario per composition; its checks run in order on the same mounted example.
// Expectations were read from the accessibility tree and real key presses on 31814e9.
// [Key] renders as a key cap. `known` names a suspected finding, so a fail confirms it.
//
// Scope, by owner decision on 2026-11-03: checks that passed in the first pass (run on
// 0.2.0 by mistake) are not repeated. This plan holds the checks with a reported problem,
// those whose subject did not exist in 0.2.0, and checks added since. Expectations follow
// the fixes recorded in packages/ui/verification/orca-2026-11-03.md.

export const cheatsheet = [
  "Включить или выключить Orca: [Super]+[Alt]+[S]. Замолчать посреди фразы: [Ctrl].",
  "[Orca] — клавиша Orca: [Insert], а в раскладке Laptop — [Caps Lock].",
  "[Orca]+[A] переключает режим. Browse mode: [Down]/[Up] читают страницу по строкам, [H] — следующий заголовок, [T] — таблица. Focus mode: клавиши уходят в компонент — стрелки переключают радиокнопки, пункты меню, вкладки.",
  "[Tab] и [Shift]+[Tab] ходят по элементам в обоих режимах. В поле ввода Orca сам переходит в focus mode.",
  "Если Orca молчит внутри страницы: закрой Chrome полностью и запусти google-chrome --force-renderer-accessibility.",
];

export const scenarios = [
  { id: "native", title: "Нативная форма", sample: "NativeControls",
    intro: "Радиогруппа и поля, которых не было в первом прогоне. Проверки идут подряд на одной форме.",
    checks: [
      { id: "N5", title: "Радиогруппа: стрелки и пустые остановки",
        steps: ["«К примеру», затем [Tab] трижды — на «Standard».", "[Orca]+[A] — «Focus mode». [Down], затем [Up].", "[Orca]+[A] — «Browse mode». [Up]/[Down] несколько раз по группе."],
        expect: ["[Down] выбирает «Pro» — недоступный «Research» пропущен; [Up] возвращает «Standard».", "В browse mode: строка «Plan», затем одна строка со всеми тремя вариантами — «Standard», «Research» (недоступен), «Pro» — они стоят рядом.", "Ни в одном режиме нет «blank»."] },
      { id: "N6", title: "Текстовые поля",
        steps: ["С «Standard» нажимай [Tab] по одному и слушай каждое поле."],
        expect: ["«Workspace, entry», значение «Workspace».", "«Figma token, password text» — значение не произносится.", "«Search, search entry», значение «Components», затем «Clear Search, button».", "«Notes, multi-line entry», значение «Initial notes», описание «13 of 40 characters»."] },
      { id: "N7", title: "Счётчик символов",
        steps: ["В «Notes»: [End], напечатай abc.", "[Shift]+[Tab], затем [Tab] — Orca заново читает поле."],
        expect: ["Описание теперь «16 of 40 characters»."] },
      { id: "N8", title: "Показать токен",
        steps: ["Из «Notes» [Tab] — кнопка «Show token». [Enter].", "[Shift]+[Tab] четыре раза — к «Figma token»."],
        expect: ["Кнопка называется «Show token»; запиши, если Orca читает её по буквам (на экране заглавные).", "После [Enter] кнопка — «Mask token».", "«Figma token» — обычное поле, значение «example-token» произносится."] },
    ] },
  { id: "select", title: "Select", sample: "SelectForm",
    intro: "Кнопка очистки и пустая обязательная отправка.",
    checks: [
      { id: "S6", title: "Кнопка очистки",
        steps: ["«К примеру», затем [Tab] дважды — на крестик.", "Посмотри на экран: видно ли, что фокус на крестике, а не на поле?", "[Enter]."],
        expect: ["«Clear Workspace, button».", "Кольцо фокуса на самом крестике; рамки фокуса у поля в этот момент нет.", "После [Enter] фокус на поле, Orca говорит, что оно пустое."] },
      { id: "S7", title: "Пустая обязательная отправка",
        steps: ["Поле пустое после S6. [Tab] — «Submit», [Enter]."],
        expect: ["Фокус возвращается на поле.", "Orca говорит, что поле с ошибкой («invalid entry»), и что нужно выбрать вариант."] },
    ] },
  { id: "dropdown", title: "Dropdown", sample: "DropdownControls",
    intro: "Пустые остановки между строками меню.",
    checks: [
      { id: "D3", title: "Строки меню",
        steps: ["«К примеру», [Tab], [Enter] — меню открыто, фокус на «Design».", "[Tab] — «Development», [Space].", "[Orca]+[A] — browse mode, [Up]/[Down] по строкам меню. [Orca]+[A] обратно.", "[Escape]."],
        expect: ["При открытии Orca называет окно, но не зачитывает все подписи подряд.", "«Development» после [Space] — «checked».", "В browse mode строки читаются подряд, без «blank».", "Стрелки в focus mode фокус между строками не двигают — так и задумано, строки идут по [Tab].", "После [Escape] фокус на «Choose workspaces»."] },
    ] },
  { id: "drawer", title: "Drawer", sample: "DrawerForm",
    intro: "Открытие и порядок Tab после правок; вложенное окно и закрытие уже прошли.",
    checks: [
      { id: "W1", title: "Открытие",
        steps: ["«К примеру», [Tab] — «Edit workspace», [Enter]."],
        expect: ["«Edit workspace, dialog» и «Close, button» — без чтения всех подписей полей подряд."] },
      { id: "W2", title: "Tab по панели",
        steps: ["[Tab] по одному и слушай."],
        expect: ["После «Close» сразу Workspace name — отдельной остановки на области содержимого больше нет.", "Затем Plan, Owner, Cost centre… Notes, потом Cancel, Save.", "После Save фокус может уйти на страницу — панель немодальная, так задумано."] },
    ] },
  { id: "starting", title: "Волна 7: Switcher и алерты", sample: "StartingSet",
    intro: "Пустые остановки Switcher, фокус после Undo и объявление Timer.",
    checks: [
      { id: "P3", title: "Switcher",
        steps: ["«К примеру», [Tab] дважды — на «List».", "Обязательно [Orca]+[A] — Orca должен сказать «Focus mode»: на радиокнопках он сам его не включает. Затем [Right].", "[Orca]+[A] — browse mode, [Up]/[Down] вокруг переключателя."],
        expect: ["«Workspace view», «List, radio button, checked».", "[Right] выбирает «Grid» — «Archived» пропущен.", "В browse mode [Up]/[Down] проходят весь ряд сразу — три сегмента в одной строке; это нормально.", "Нет «blank»."] },
      { id: "P9", title: "Undo у Timer",
        steps: ["[Tab] до «Undo» (у «Workspace archived»), [Enter].", "Послушай, затем [Tab]."],
        expect: ["Фокус переходит на «Show notifications, button» — пример делает это как приложение.", "Orca произносит «Archive undone»."] },
      { id: "P8", title: "Появление алертов",
        steps: ["[Shift]+[Tab] до «Close» у «Workspace imported», [Enter].", "[Enter] на «Show notifications» и ничего не нажимай."],
        expect: ["После «Close» фокус на «Show notifications».", "Orca сам произносит «Workspace imported…» и «Workspace archived»."] },
    ] },
  { id: "table", title: "Таблица", sample: "Table",
    intro: "Навигация по ячейкам (в первом прогоне были неверные клавиши), сортировка и фильтр.",
    checks: [
      { id: "C2", title: "Навигация по таблице",
        steps: ["«К примеру». Browse mode, [T] — Orca переходит к таблице.", "[Alt]+[Shift]+[Down] — вниз по ячейкам, [Alt]+[Shift]+[Right] — вправо."],
        expect: ["«Workspace subscriptions, table», 3 столбца, 5 строк.", "Заголовок звучит как «Amount» (не «Amount Sort by Amount»), с «sorted ascending».", "Каждая ячейка читается вместе с заголовком своего столбца."] },
      { id: "C3", title: "Сортировка",
        steps: ["[Tab] до «Sort by Amount», [Enter].", "Browse mode, [Up] — к строке заголовков."],
        expect: ["«Sort by Amount, button».", "После [Enter] «Amount» — «sorted descending», порядок строк обратный."] },
      { id: "C4", title: "Фильтр",
        steps: ["[Tab] до «Active workspaces only» под таблицей, [Space].", "[Shift]+[Tab] до «Clear status filter», [Enter]."],
        expect: ["Появляется «Clear status filter, button».", "После [Enter] фильтр снят, в таблице снова 4 строки, галочка снята."] },
    ] },
];
