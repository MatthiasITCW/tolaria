# Design System Proposal for Laputa

## Current State Assessment

### What exists today
- **53 top-level frames** scattered across a ~6800x11400px canvas with no spatial logic
- **0 reusable components** (every frame is ad-hoc)
- **~40 design variables** with light/dark theme support (colors, radii, fonts)
- **2 foundation frames**: Color Palette and Typography & Spacing Specs
- **1 full-app layout** frame (light mode only)
- **4 sidebar-collapse variations** showing different panel states

### Recurring patterns that should be components (but aren't)
By analyzing the 53 frames, these patterns are duplicated 3-10x each:

| Pattern | Where it appears | Times duplicated |
|---------|-----------------|-----------------|
| Inspector section header (label + action icon) | rbF01-03, reF01-03, pi01 | 7x |
| Note list item (title + snippet + date + dot) | dp01-04, mni01-04, trNL1 | ~10x |
| Tab bar tab (label + close + dot indicator) | dp10, mni10, full layout | 3x |
| Sidebar filter item (icon + label + count) | trSB1, full layout sidebar | 4x |
| Sidebar section group (chevron + icon + label) | full layout, drag frames | 4x |
| Breadcrumb bar (icon + path + badges) | dp20, archBtnNorm/Arc, full layout | 4x |
| Modal shell (header + body + footer) | ghv01-04, iogBH (settings) | 5x |
| Property row (label + value) | urlDefault/Hover/Edit, pi01 | 4x |
| Relationship pill (icon + label + X) | trRI1, reF01-03, rbF01-03 | 6x |
| Status badge (colored dot/pill) | dp01, dp10, dp20, dp30 | 4x |
| Status bar (version + branch + sync) | mni20, full layout | 2x |
| Search bar (dark themed) | 3aG9b, K1O2x, nrIcZ | 3x |
| Warning/info banner | trW30 | 1x (but will recur) |

Every time a new feature is designed, these get rebuilt from scratch.

---

## Proposed Structure

### Single file: `ui-design.pen`

Multiple files creates friction (can't reference components cross-file, harder to maintain). Keep one file, organized into logical **sections** using large container frames as visual grouping. Each section is a horizontal band across the canvas.

### Canvas Layout (top to bottom)

```
y ≈ 0      ┌─────────────────────────────────────────────┐
            │  0. COVER                                    │
            │  App name, version, last updated, TOC        │
            └─────────────────────────────────────────────┘

y ≈ 200    ┌─────────────────────────────────────────────┐
            │  1. FOUNDATIONS                               │
            │  Color palette, Typography scale, Spacing,    │
            │  Border radius, Shadows, Iconography          │
            └─────────────────────────────────────────────┘

y ≈ 1800   ┌─────────────────────────────────────────────┐
            │  2. COMPONENTS (Reusable)                     │
            │  Atoms → Molecules → Organisms                │
            │  Each component: default + states side by side│
            └─────────────────────────────────────────────┘

y ≈ 5000   ┌─────────────────────────────────────────────┐
            │  3. PATTERNS / COMPOSITIONS                   │
            │  Panel Inspector, Panel NoteList, Panel Editor│
            │  Modal shell, Popover/dropdown shell          │
            └─────────────────────────────────────────────┘

y ≈ 7000   ┌─────────────────────────────────────────────┐
            │  4. FULL LAYOUTS                              │
            │  Default state, Sidebar collapsed, Editor     │
            │  only, etc. (full 1440x900 frames)            │
            └─────────────────────────────────────────────┘

y ≈ 12000  ┌─────────────────────────────────────────────┐
            │  5. FEATURE SPECS                             │
            │  Grouped by feature area — all current 53     │
            │  frames reorganized here                      │
            └─────────────────────────────────────────────┘
```

Each section starts with a **section label frame** (large text, description, horizontal rule). Within each section, frames flow **left to right, wrapping down**, with 100px spacing.

---

## Section 1: Foundations

### What to keep
- **Color Palette** (frame `mOf4J`) — already good. Move to top of file.
- **Typography & Spacing** (frame `HZonq`) — already good. Place next to color palette.

### What to add
- **Spacing Scale** — explicit 4px grid reference (4, 8, 12, 16, 20, 24, 32, 40, 48, 64) with visual boxes
- **Shadow Tokens** — overlay shadow, dialog shadow, dropdown shadow (currently only documented in CSS, not in the design file)
- **Icon Reference** — small grid showing common Lucide + Phosphor icons used in the app, at 14px and 16px sizes

### Variables to add
The .pen file already has `--radius-sm/md/lg` but is missing spacing variables. Add:

| Variable | Value | Usage |
|----------|-------|-------|
| `--space-xs` | 4 | Tight gaps (icon-to-label) |
| `--space-sm` | 8 | Standard gap |
| `--space-md` | 12 | Section padding |
| `--space-lg` | 16 | Panel padding |
| `--space-xl` | 24 | Large section gaps |
| `--space-2xl` | 32 | Page padding |
| `--space-3xl` | 48 | Section dividers |

---

## Section 2: Component Library

### Atomic Design Hierarchy

#### Atoms (smallest building blocks)

| Component | Variants/States | ID Prefix |
|-----------|----------------|-----------|
| **Button/Primary** | default, hover, active, disabled | `c/btn-pri` |
| **Button/Secondary** | default, hover, active, disabled | `c/btn-sec` |
| **Button/Ghost** | default, hover, active | `c/btn-ghost` |
| **Button/Destructive** | default, hover, disabled | `c/btn-dest` |
| **Button/Icon** | default, hover (icon-only button, e.g. close, settings) | `c/btn-icon` |
| **Input/Text** | empty, filled, focused, error, disabled | `c/input` |
| **Input/Search** | empty, with query, with clear button | `c/input-search` |
| **Badge** | default, secondary, outline, destructive, status colors (green/orange/red/blue/purple) | `c/badge` |
| **Status Dot** | green (new), orange (modified), none (clean) | `c/status-dot` |
| **Checkbox** | unchecked, checked, indeterminate | `c/checkbox` |
| **Toggle** | off, on | `c/toggle` |
| **Icon** | 14px, 16px, 20px wrapper with Lucide/Phosphor | `c/icon` |
| **Separator** | horizontal, vertical | `c/sep` |
| **Avatar/Initial** | letter avatar for Person entities | `c/avatar` |
| **Tooltip** | top, bottom (container with pointer) | `c/tooltip` |

#### Molecules (composed from atoms)

| Component | Composition | States | ID Prefix |
|-----------|------------|--------|-----------|
| **Sidebar/FilterItem** | icon + label + count badge | default, active, hover | `c/sb-filter` |
| **Sidebar/SectionHeader** | chevron + icon + label + add button | collapsed, expanded, hover, dragging | `c/sb-section` |
| **Sidebar/SectionItem** | indent + label | default, active, hover | `c/sb-item` |
| **Sidebar/TopicItem** | hash + label | default, active, hover | `c/sb-topic` |
| **NoteList/Item** | status dot + title + snippet + date + type pill | default, selected, hover, modified, new | `c/nl-item` |
| **NoteList/Header** | title + count + sort button | — | `c/nl-header` |
| **Tab** | label + close btn + modified dot | default, active, hover, modified | `c/tab` |
| **BreadcrumbBar** | path segments + word count + status badge | new, modified, clean | `c/breadcrumb` |
| **Property/Row** | label + value | default, hover, editing | `c/prop-row` |
| **Property/URLRow** | label + link + copy/edit icons | default, hover, editing | `c/prop-url` |
| **Relationship/Pill** | icon + label + (X remove on hover) | default, hover, trashed, archived | `c/rel-pill` |
| **Relationship/AddInput** | search input with autocomplete | empty, typing, results | `c/rel-add` |
| **Inspector/SectionHeader** | label + action button | default, hover | `c/insp-header` |
| **Git/CommitItem** | hash + message + author + date (timeline style) | — | `c/git-commit` |
| **Search/ResultItem** | title + path + highlighted snippet | default, selected | `c/search-result` |
| **Sort/DropdownItem** | label + direction arrow + checkmark | default, selected | `c/sort-item` |
| **Banner/Warning** | icon + message + optional action | info, warning, error | `c/banner` |
| **Wikilink** | colored link text (varies by entity type) | 8 type colors | `c/wikilink` |

#### Organisms (panel-level compositions)

| Component | Content | ID Prefix |
|-----------|---------|-----------|
| **Panel/Sidebar** | title bar + filters + sections + commit area | `c/panel-sidebar` |
| **Panel/NoteList** | header + type pills + item list | `c/panel-notelist` |
| **Panel/Editor** | tab bar + breadcrumb + content area | `c/panel-editor` |
| **Panel/Inspector** | properties section + relations + backlinks + history | `c/panel-inspector` |
| **Modal/Shell** | header + tab bar (opt) + body + footer | `c/modal` |
| **Popover/Dropdown** | list of items + separator + annotation | `c/popover` |
| **StatusBar** | left info + right info | `c/statusbar` |
| **TitleBar** | traffic lights (macOS) | `c/titlebar` |

---

## Section 3: Patterns / Compositions

These are **non-reusable** reference frames showing how components compose into real UI sections. Think of them as "component playgrounds" — they use component instances to build real UI, but they're documentation, not building blocks.

- **Inspector states**: Properties expanded, Relations with pills, Referenced By with/without entries, Backlinks, Git history
- **NoteList states**: All Notes view, filtered by section, empty state, search results
- **Sidebar states**: All sections expanded, one collapsed, dragging reorder, after reorder
- **Editor states**: Single tab, multiple tabs, modified tabs, diff view
- **Modal patterns**: GitHub Vault flow (4 states), Settings, Create Note, Commit Dialog

---

## Section 4: Full Layouts

| Frame | Description |
|-------|-------------|
| **Default — All Panels** | 1440x900, sidebar + notelist + editor + inspector |
| **Sidebar Collapsed** | Editor area wider, collapse button visible |
| **Editor + NoteList Only** | No sidebar or inspector |
| **Editor Only** | Focused writing mode |
| **AI Chat Open** | Inspector replaced with AI Chat panel |
| **Quick Open Modal** | Cmd+P overlay on default layout |

Keep the existing 5 layout frames (qHhaj + SC_all/nosb/edonly/ednl). Add AI Chat and Quick Open.

---

## Section 5: Feature Specs

Reorganize existing 53 frames into feature groups. Each group gets a **feature label** frame above it:

| Group | Frames to include |
|-------|-------------------|
| **Note Status & Indicators** | dp01, dp10, dp20, dp30, mni01, mni10, mni20 |
| **Trash & Archive** | trSB1, trNL1, trRI1, trW30, archBtnNorm, archBtnArc |
| **Inspector & Properties** | pi01, pi50, rbF01-03, reF01-03, urlDefault/Hover/Edit |
| **Sidebar** | dsg01a-04j, csB01, csA01 |
| **GitHub Vault** | ghv01-04, ghv03 |
| **Git History** | ghCL1, ghDO1, vc001, vc100, vc200 |
| **Sort & Search** | srtDD, srtBN, 3aG9b, K1O2x, nrIcZ |
| **Editor & Wikilinks** | wlc01 |
| **Settings** | iogBH |
| **Virtual List** | vl001 |

---

## Naming Convention

### Frames
```
Section-level:   "== FOUNDATIONS =="
                 "== COMPONENTS =="
                 "== FULL LAYOUTS =="

Feature groups:  "Feature: Trash & Archive"
                 "Feature: Note Status"
```

### Reusable Components
```
component/<category>/<name>

Examples:
  component/button/primary
  component/button/ghost
  component/sidebar/filter-item
  component/notelist/item
  component/inspector/section-header
  component/modal/shell
```

### States (within a component frame)
```
<component-name> — <state>

Examples:
  Button/Primary — Default
  Button/Primary — Hover
  NoteList/Item — Selected
  NoteList/Item — Modified
```

### Feature Spec Frames
```
<Feature> — <Specific View>

Examples:
  Trash — Note List View
  Trash — 30-Day Warning
  Git History — Commit List
  Git History — Diff Open
```

---

## Implementation Priority

### Phase 1: Foundation Cleanup (2-3 hours)
1. Add spacing variables to the .pen file
2. Move Color Palette and Typography frames to top of canvas (y ≈ 200)
3. Add section label frames as visual dividers
4. Reorganize existing 53 frames into the feature-spec section (y ≈ 12000+)
5. Create cover frame at y ≈ 0

**Impact**: Clean canvas, easy to navigate. Zero component work yet.

### Phase 2: Core Atoms (3-4 hours)
1. **Button** — 4 variants x 3 states = ~12 sub-frames, all as `reusable: true`
2. **Badge** — 6 color variants + 4 style variants
3. **Status Dot** — green, orange, red, none
4. **Input** — text + search variants
5. **Separator** — horizontal + vertical
6. **Icon Button** — close, settings, chevron, etc.

**Impact**: Building blocks exist. Future features can pull from them.

### Phase 3: Core Molecules (4-5 hours)
1. **Sidebar/FilterItem** — most reused sidebar pattern
2. **Sidebar/SectionHeader** — with chevron and add button
3. **NoteList/Item** — the most duplicated pattern in the file
4. **Tab** — with modified indicator states
5. **Property/Row** — default/hover/edit states
6. **Relationship/Pill** — normal/trashed/archived states
7. **Inspector/SectionHeader** — label + collapse/action

**Impact**: Feature specs can be rebuilt from instances. Consistency guaranteed.

### Phase 4: Organisms (3-4 hours)
1. **Modal/Shell** — replace 5 ad-hoc modals with instances of one shell
2. **Panel/Sidebar** — full sidebar composition
3. **Panel/NoteList** — full notelist composition
4. **StatusBar** — standardize
5. **Popover/Dropdown** — for sort, autocomplete, etc.

**Impact**: Full layouts can be composed from panel organisms.

### Phase 5: Rebuild Full Layouts (2-3 hours)
1. Rebuild "Laputa App — Full Layout (Light)" using component instances
2. Create remaining layout variants (AI Chat, Quick Open)
3. Ensure all layouts use the same component instances for consistency

**Impact**: Single source of truth. Change a button component, all layouts update.

### Phase 6: Feature Spec Cleanup (2-3 hours)
1. Rebuild key feature specs using component instances where possible
2. Remove frames that are now redundant (covered by component states)
3. Add any missing feature-specific variations

**Impact**: Clean, maintainable feature documentation.

---

## Estimated Total Effort

| Phase | Effort | Cumulative |
|-------|--------|-----------|
| 1. Foundation Cleanup | 2-3h | 2-3h |
| 2. Core Atoms | 3-4h | 5-7h |
| 3. Core Molecules | 4-5h | 9-12h |
| 4. Organisms | 3-4h | 12-16h |
| 5. Full Layouts | 2-3h | 14-19h |
| 6. Feature Cleanup | 2-3h | 16-22h |

**Recommendation**: Do phases 1-3 first (9-12h). This covers 80% of the value — clean organization + the most reused components. Phases 4-6 can happen incrementally as features are designed.

---

## What "World Class" Looks Like

After this work, `ui-design.pen` will:

1. **Open to a cover page** with app identity and section navigation
2. **Have ~30 reusable components** that match the real implementation 1:1
3. **Use variables everywhere** — no hardcoded colors, spacing, or radii
4. **Show every component state** — no guessing what hover/active/disabled looks like
5. **Compose layouts from instances** — change a component, all layouts update
6. **Group features logically** — find any feature spec in seconds
7. **Grow naturally** — new features just add instances of existing components + new feature-specific frames

The key shift: **from "collection of screenshots" to "living system of composable parts"**.
