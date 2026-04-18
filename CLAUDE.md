# Browser Game — Claude Code Guide

## Project Overview

Browser-based game. npm workspaces monorepo: React 18 + TypeScript + Vite client, Express + TypeScript server. Minimal scaffold only — no game pages exist yet.

---

## Architecture

### Monorepo Layout

```
First_Claude_Project/
├── package.json          # root — scripts, devDependencies shared across workspaces
├── tsconfig.base.json    # shared TS options (strict: true)
├── .eslintrc.js          # ESLint config for both workspaces
├── .prettierrc           # Prettier config
├── .env                  # local env vars (never committed)
├── .env.example          # committed template for .env
├── .claude/settings.local.json
├── client/               # React 18 + Vite SPA (workspace: "client")
│   ├── vite.config.ts    # proxy /api → :3001, alias @/* → src/*
│   └── src/
│       ├── main.tsx
│       └── App.tsx
└── server/               # Express REST API (workspace: "server")
    └── src/
        └── index.ts      # bootstrap: mounts routes, listens on PORT (default 3001)
```

### Client–Server Communication

Vite runs on :5173 and proxies `/api/*` to `http://localhost:3001`. The client always fetches `/api/...` — never hardcode `http://localhost:3001` in client code.

### Environment Variables

Server loads `.env` from the project root via `dotenv`. Always add new vars to `.env.example` with a comment. Never commit `.env`.

Current variables:
- `PORT` — Express listen port (default 3001)

---

## Scripts (run from project root)

| Script                                       | What it does |
|----------------------------------------------|---|
| `npm run dev`                                | Starts client (:5173) and server (:3001) concurrently |
| `npm run build`                              | Type-checks and builds both workspaces |
| `npm run lint`                               | ESLint across client/src and server/src |
| `npm run format`                             | Prettier --write on all .ts/.tsx source files |
| `npm run test`                               | Runs all tests in both workspaces (once, CI mode) |
| `npm run test --workspace=client`            | Client tests only |
| `npm run test --workspace=server`            | Server tests only |
| `npm run test:coverage --workspace=client`   | Client tests with coverage report |
| `npm run test:watch --workspace=server`      | Server tests in watch mode |

---

## Testing

### Test Runner

Vitest is used in both workspaces. Vite-native for the client (shares `vite.config.ts`), standalone config for the server (`server/vitest.config.ts`). Jest-compatible API (`describe`/`it`/`expect`/`vi`).

### File Placement Convention

Co-locate test files with the source file they test:

```
src/
├── components/
│   ├── GameBoard.tsx
│   └── GameBoard.test.tsx   ← test lives next to its subject
├── lib/
│   ├── scoring.ts
│   └── scoring.test.ts
└── test/
    └── setup.ts             ← global test setup only, not a test itself
```

Use `__tests__/` only for shared test utilities or fixtures used across multiple test files.

### Test Structure (AAA)

```ts
describe('MyComponent', () => {
  it('does the specific thing', () => {
    // Arrange
    const props = { value: 42 };
    // Act
    render(<MyComponent {...props} />);
    // Assert
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
```

`describe` names the unit under test. `it` names observable behavior from the user's perspective.

### Client Tests (React Testing Library)

- Query with `screen.*` — prefer `getByRole`, `getByLabelText`, `getByText` over `getByTestId`.
- Use `userEvent` (not `fireEvent`) for all interactions — it simulates real browser events.
- Mock `fetch` with `vi.stubGlobal` in `beforeEach`; restore with `vi.unstubAllGlobals()` in `afterEach`.
- Never assert on internal state or implementation details. Test what the user sees and can do.

### Server Tests (Supertest)

```ts
import request from 'supertest';
import { app } from './index'; // app is exported separately from listen()
```

- Test HTTP behavior: status codes, response shape, error responses.
- Unit-test services (pure functions) in isolation — no Express, no HTTP.

### What NOT to Test

- React or Express framework internals
- Third-party library behavior (cors, dotenv, RTL itself)
- Implementation details (internal state, private functions)
- `main.tsx` — it is a mount call, not logic

---

## Coding Conventions

### TypeScript
- `strict: true` is enforced. Never disable it or add `@ts-ignore` without a justification comment.
- Use `unknown` instead of `any`.
- Prefer explicit return types on exported functions.

### Path Aliases
The client uses `@/*` → `client/src/*`. Always use `@/` for intra-client imports. Never use `../../` relative paths that cross feature boundaries.

```ts
// correct
import { GameBoard } from '@/components/GameBoard';
// wrong
import { GameBoard } from '../../components/GameBoard';
```

The server has no path aliases; use relative imports.

### Formatting
Prettier: single quotes, semicolons, 2-space indent, trailing commas (es5), 100-char width. The PostToolUse format hook runs automatically after edits.

### ESLint
- `react-hooks/recommended` is active — exhaustive-deps warnings are real bugs.
- `@typescript-eslint/recommended` is active — all errors are blocking.
- `react/react-in-jsx-scope` is OFF (React 18 JSX transform).

### React Patterns
Functional components only. One component per file; filename matches the exported component name.

---

## Folder Structure for New Features

### Client: `client/src/`

```
client/src/
├── components/       # Reusable, stateless/lightly-stateful UI components
├── features/         # Self-contained feature modules (game screens, flows)
│   └── lobby/
│       ├── LobbyPage.tsx     # top-level page component: <Feature>Page
│       └── components/       # components only used inside this feature
├── hooks/            # Custom React hooks shared across features
├── lib/              # Pure utility functions (no React)
├── types/            # Shared TypeScript interfaces
├── api/              # Fetch wrapper functions for /api/* endpoints
├── App.tsx
└── main.tsx
```

### Server: `server/src/`

```
server/src/
├── routes/           # Express routers, one file per domain area
├── middleware/       # Express middleware functions
├── services/         # Business logic, no HTTP concerns
├── types/            # TypeScript interfaces
└── index.ts          # Thin bootstrap: mounts routes, starts listener
```

Register new routers in `index.ts`: `app.use('/api/<domain>', router)`.

---

## Subagent Usage Guide

### Use Explore when
- Understanding how/where something is implemented across multiple files
- Auditing all usages of a pattern before refactoring
- Mapping blast radius of a change to a shared type or utility
- Use `thorough` when the result drives an architectural decision; `quick` when you have a strong hypothesis

### Use Plan when
- A task spans both client and server
- Choosing between structural approaches (state location, API shape)
- Requirements are ambiguous enough that clarifying before editing prevents rework

### Use general-purpose when
- Delegating a clearly scoped multi-step implementation with well-defined inputs/outputs

### Do NOT use subagents for
- Single-file edits with obvious implementation
- Reading or searching one or two known files
- Mechanical refactors (rename, format, reorder)

Over-using subagents fragments context and produces worse results than handling inline.

---

## Project-Specific Rules

1. Never commit `.env`. Use `.env.example` to document variables.
2. Always use `@/` alias for client imports from `src/`. No `../../` crossing feature boundaries.
3. Keep `server/src/index.ts` as a thin bootstrap. Logic → `services/`, routing → `routes/`.
4. Client fetches only `/api/*`. Never hardcode `http://localhost:3001` in client code.
5. Run `npm run lint` and `npm run build` before considering any feature complete.
6. When adding an env var: add to `.env.example` (with comment), `.env` locally, and this file.
