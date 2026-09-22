# Sixth Ward Tool Library: Build Specification
**Version 1.1. Designing for Development, Build A.**

---

## Purpose

Members of the Sixth Ward Tool Library need to see what is available before walking over. This site lets a member browse the catalog, check one tool's status, and reserve it for pickup.

## Scope

In scope: three screens, client-side filtering, and a hold flow that ends in a confirmation.

Out of scope: accounts, login, payment, staff tools, search across anything other than tool name, and any server-side behavior. Hold data is not persisted. Placing a hold routes to the confirmation screen and nothing else.

## Technical constraints

- Static HTML, CSS, and JavaScript. No framework, no build step beyond Tailwind, no backend.
- Tailwind CSS v4. The theme file is provided at `src/input.css` and compiles to `dist/styles.css`. Do not add a `tailwind.config.js`.
- Use the theme's tokens for color, spacing, radius, and type. A raw hex value or pixel value in a class name means the build has stepped outside the design system.
- Catalog data lives in the provided `data/tools.json`, loaded client side with `fetch`. The site has to be served, since browsers block `fetch` from a file opened directly.
- Category icons are provided in `images/`, one per category, named by category id: `images/power-tools.svg`, and so on.
- Fonts are Inter for body text and Source Serif 4 for display text. Both are already linked in each page's head.
- Must work at 375px and 1440px. Two breakpoints, no more.
- Deploys as a static site.

## Content model

`data/tools.json` holds two lists.

**`categories`** declares the six categories in display order. Each has an `id` and a `label`.

**`tools`** holds one record per tool:

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable, used in the detail URL |
| `name` | string | Display name |
| `category` | string | A category `id`. The icon comes from this field. |
| `summary` | string | One sentence |
| `availability` | enum | `available`, `checked_out`, `repair`, `retired` |
| `due_back` | date or null | Present only when `availability` is `checked_out` |
| `requires_orientation` | boolean | |
| `members_only` | boolean | |
| `deposit` | number | Dollars. `0` means no deposit |

**Availability is exclusive. The three flags are independent of availability and of each other.** A tool can be available, members only, and carry a deposit at the same time. Render all applicable flags, not the first one.

The data file holds ten records. One is retired, which leaves nine in the catalog.

## Screen 1: Catalog

File: `index.html`.

Header with the library name and a link to the catalog. Below it, a filter bar: a category select with all six categories plus "All," an "Available only" toggle, and a text input that filters on tool name. Filters combine, so an active category and an active toggle both apply.

Below the filter bar, a result count in the form "9 tools" or "1 tool," then a grid of tool cards. Three columns at 1440, one at 375.

Each card shows the category icon, the name, the category label, one availability badge, and one meta line. A retired tool never appears in the catalog at any filter setting.

**The meta line** follows this rule, in priority order:

1. Checked out: "Due back October 14," using the tool's own date
2. Out for repair: "Currently unavailable"
3. Otherwise, the access flags that apply, in the order members only, orientation, deposit, joined with a period: "Members only. Orientation required. Deposit $60"
4. No flags at all: "No deposit"

When the active filters return zero tools, replace the grid with an empty state: a short line saying nothing matched and a control that clears all filters.

Clicking a card opens that tool's detail screen.

## Screen 2: Tool detail

File: `tool.html`.

Icon, name, category label, and summary. An availability block showing the badge and, when checked out, the due-back date in the form "Due back October 14." Access flags render as a short list with one line of explanation each:

- Members only: "Sixth Ward membership is required to borrow this tool."
- Requires orientation: "A 20-minute safety orientation is required before first checkout."
- Deposit: "A $40 refundable deposit is held at pickup." Use the tool's own deposit amount.

A primary action whose label and state depend on availability:

| Availability | Action |
|---|---|
| `available` | "Place hold," enabled |
| `checked_out` | "Join waitlist," enabled |
| `repair` | "Unavailable," disabled, with the line "This tool is out for repair." |
| `retired` | Screen is not reachable |

A back link returns to the catalog with prior filters still applied.

## Screen 3: Hold confirmation

File: `confirmation.html`.

Reached only from the primary action on Screen 2. Shows the tool name, a pickup window of "within 3 days," a short "what to bring" list that reflects that tool's flags (membership card, deposit amount, orientation), and a link back to the catalog.

## Component states

Every interactive element needs default, hover, focus-visible, and disabled where applicable. Focus indicators are required and must be visible against the surface color. The theme file provides a focus outline. Do not remove it without replacing it.

## Accessibility requirements

- Every icon has alt text or is marked decorative, whichever is correct for its use.
- Availability is conveyed by text, not by color alone.
- The result count updates in a live region so filter results are announced.
- The full flow works by keyboard: filter, open a tool, place a hold, return.
- Contrast meets WCAG 2.1 AA for text and for the focus indicator.

## Known gaps in this specification

Two things this document does not resolve, listed here because a specification that hides its gaps is worse than one that names them:

1. **What the waitlist actually does.** The button exists and routes to confirmation. The confirmation copy for a waitlist hold has not been written.
2. **Sort order in the catalog.** Currently whatever order `tools.json` uses. Nobody decided whether available tools should sort first.

Make a decision on each, build it, and write down what you decided.
