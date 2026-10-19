# Project Agent Guidelines (Movement Books)
**Pride In Movement Physical Therapy — Financial & Tax Management App**

## Dev Server & Browser Testing Port
- **User Port (5173)**: The user keeps their primary active development server running on port `5173` (`http://localhost:5173/`).
- **AI / Agent Port (5174)**: Automated agents, subagents, and browser tests MUST NEVER test or connect to port `5173`.
- **Target URL**: Always connect to or test against port `5174`: `http://localhost:5174/`.
- **Launching Port 5174**: If port 5174 is not running, launch it as a background daemon process using:
  `npm run dev -- --port 5174` (with `IsDaemon: true`).
- **Browser Testing with Chrome DevTools MCP**:
  - Automated browser verification, UI testing, and DOM inspection MUST prefer the `chrome-devtools-mcp` MCP server tools (`navigate_page`, `resize_page`, `evaluate_script`, `click`, `take_screenshot`, `list_console_messages`, etc.) over standalone Playwright runners.
  - `chrome-devtools-mcp` communicates directly via the Chrome DevTools Protocol (CDP) within Antigravity IDE.
  - Standard agent verification workflow:
    1. Verify port 5174 is running (launch daemon `npm run dev -- --port 5174` with `IsDaemon: true` if needed).
    2. Navigate using `chrome-devtools-mcp:navigate_page` to `http://localhost:5174/`.
    3. Check console hygiene via `chrome-devtools-mcp:list_console_messages` to ensure zero unhandled exceptions or React crashes.
    4. Resize viewport via `chrome-devtools-mcp:resize_page` (mobile `width: 375, height: 667` vs desktop `width: 1280, height: 800`).
    5. Inspect state via `evaluate_script` or visually verify rendering using `take_screenshot`.

## Project Architecture & Tech Stack
- **Stack:** React 19 + TypeScript + Vite.
- **State Management:** Zustand, split into modular slices (`incomeSlice`, `expenseSlice`, `pnlSlice`, `settingsSlice`). Use targeted selectors (e.g. `useIncomeStore((s) => s.records)`) to prevent unnecessary re-renders.
- **Data Persistence:** Local-first client persistence via `localStorage` / `IndexedDB` with one-click JSON backup & restore.
- **Privacy & Security Invariant:** 100% client-side data parsing and storage. Sensitive patient names, invoice numbers, and financial records MUST NEVER be transmitted to external servers or cloud APIs.
- **Icons & Accessibility:** Use `lucide-react` icons wrapped in a flex container with `gap: 6px`. Never use raw OS emojis. Icon-only buttons must provide an `aria-label` or `title`.
- **Formatting & Build:** Enforce TypeScript zero-error compilation (`npm run check` / `tsc -b`).

## Anti-God-File & Modular Architecture Protocol
- **Hard Line Ceiling (400–500 Lines):** No component or custom hook file should exceed 400 lines (500 absolute maximum for exceptionally dense data tables or reports). If a file exceeds 400 lines, or your proposed edit would push it over 400 lines, you MUST decompose it into sub-components, sub-hooks, or utility modules as part of the task.
- **Orchestrator Role for Modals & Views:** Container and page components (`*Page.tsx`, `*Modal.tsx`) must act strictly as orchestrators/routers:
  - **Headers & Toolbars:** Extracted to `FeatureHeader.tsx` or `FeatureToolbar.tsx`.
  - **Tabs & Card Groups:** Each tab or distinct card group MUST be its own component file (e.g., `IncomeTab.tsx`, `ExpenseTab.tsx`, `PnlTab.tsx`).
  - **Tables & Rows:** Tables (`*Table.tsx`) and dense rows (`*Row.tsx`) must be separated.
  - **Drawers & Modals:** Transaction split modal, receipt drawer, or manual entry forms must be separated into their own component files.
- **Hook Decomposition by Concern:** Never bundle parsing, financial math, and UI event handlers into one mega-hook:
  - **Parser Hooks / Utils (`embodiaParser.ts`, `stripeParser.ts`, `bankParser.ts`):** Pure functions that parse CSV text and normalize into typed records.
  - **Operation Hooks (`useIncomeOps.ts`, `useExpenseOps.ts`, `usePnlCalculations.ts`):** State mutation algorithms, filtering, and financial calculations.
  - **Orchestrator Hook:** Holds primary state/refs, calls sub-hooks, and returns the cohesive public interface.
- **Pure Helpers & Static Data Separation:** Never define static tax categories, Schedule C mappings, Embodia column aliases, or currency formatters inside a component or hook. Extract them to `src/utils/taxCategories.ts`, `src/utils/currencyMath.ts`, or `src/utils/dateUtils.ts`.
- **No Inline Functional Components:** Never declare inner functional components inside the same file or inside another component. Every sub-component must be an exported component in its own file.
- **Pre-Edit Size Audit:** Before modifying any file, check its existing line count. If it is already over 400 lines, plan a modular split before appending new logic.
- **3-Stage Feature Construction:** Construct features in order:
  1. *Stage 1 (Types & Math):* Define interfaces in `src/types/` and pure math/parsers in `src/utils/`.
  2. *Stage 2 (Sub-Components):* Build headers, tables, summary cards, and modals as separate files.
  3. *Stage 3 (Orchestrator):* Wire together in the parent view with state and selectors.
- **Zustand Selector Hygiene:** NEVER call `const state = useAppStore()` inside a rendering component. Always bind to targeted leaf properties (e.g. `useIncomeStore((s) => s.records)`) to prevent full-tree re-render cascades.

## Financial Math & Invariants
- **Cents-Safe Precision Math:** Financial arithmetic must never suffer from floating-point accumulation errors. All monetary calculations must use safe rounding helpers (e.g. `roundCurrency(cents / 100)` or integer cents).
- **Cash Basis as Primary:** For PT solo practice tax reporting, revenue recognition is primarily cash-basis (recognized on `Paid at` date where `Total paid > 0`).
- **Split Transaction Invariant:** When splitting a mixed transaction (Business vs Personal), the sum of all split segments MUST strictly equal the original transaction amount: `sum(splits) === originalAmount`.
- **Duplicate Prevention:** Incoming CSV imports must generate a deterministic hash/fingerprint (e.g. `date-description-amount-id`) to detect and prompt for duplicates without double-counting revenue or expenses.

## Design & UI Aesthetics
- **Theme & Aesthetics:** Modern, crisp financial interface with dark/light themes. Uses CSS variables for consistent design tokens:
  - Primary / Accent: `--primary` (Pride In Movement signature indigo/emerald)
  - Semantic Status: `--income-green` (`#10B981`), `--expense-red` (`#EF4444`), `--warning` (`#F59E0B`)
  - Backgrounds: `--bg`, `--card-bg`, `--card-alt`, `--border`
  - Text: `--text-main`, `--text-muted`, `--text-accent`
- **Component Styling:** Clean CSS modules or companion CSS files per component. Responsive down to 375px mobile screens.

## Token Budget & Session Hygiene Protocol
- **Default "Daily Driver" (Gemini 3.8 Flash - Medium Thinking):**
  - **Medium thinking is the standard default for routine coding, UI additions, and QA.** It provides high precision while consuming ~75–85% fewer tokens than High.
  - **Turn/Step Hygiene Ceiling (15–25 Steps Max):** A single chat session MUST NEVER balloon past 20–25 agent steps. If a complex task nears 20 turns, commit working progress and output a concise handoff prompt for a fresh chat.
- **High Thinking Escalation & Advisories:**
  - **Candidate for High Thinking:** Use High for foundational greenfield architecture, complex CSV parser engines with irregular date/character encodings, or annual P&L tax reconciliation math.
  - **Agent De-escalation Advisory:** If the user sends a routine Builder prompt or minor bug fix on **High thinking**, output a Quota Advisory reminding the user that **Gemini 3.8 Flash (Medium)** will conserve their 5-hour quota, unless they intentionally reply "proceed".
- **Scout Mode (Auditing & Investigation - Medium Thinking):**
  - Read-only diagnostics via grep and file views; concludes with ready-to-run Builder prompts for a fresh session.
- **Builder Mode (Feature Construction - Medium Thinking):**
  - Apply targeted edits across planned files.
  - **MANDATORY STATIC VERIFICATION:** The agent MUST run `npm run check` immediately after making edits to ensure zero TypeScript errors.
  - Once verified, output a self-contained **Browser QA Prompt** and advise running it in a fresh chat.
- **QA / Tester Mode (Browser Verification - Medium Thinking):**
  - Launch port 5174 daemon if inactive (`npm run dev -- --port 5174` with `IsDaemon: true`).
  - Navigate to `http://localhost:5174/`.
  - Check console hygiene via `list_console_messages` (zero errors/warnings).
  - Test UI interactions (uploading test files, creating split transactions, verifying P&L calculations).
