# Testing

## Framework

- **Vitest 3** (Node 20-compatible) with `@vitest/coverage-v8` for coverage.
- `@testing-library/react` + `jsdom` for component tests (per-file `// @vitest-environment jsdom`).
- No other test framework is used.

## Commands

```bash
yarn test            # run once
yarn test:watch      # watch mode
yarn test:coverage   # coverage report (text + html in /coverage)
```

## Organization

- Unit tests live next to their modules: `src/backend/**/*.test.ts` and `src/frontend/**/*.test.tsx`.
- Backend business logic is tested without a database or real providers by mocking module boundaries (`vi.mock`).
- Component tests use jsdom and mock `fetch`/localStorage.

## What to test

Priority order:

1. **Validation schemas** — valid, missing, malformed, boundary, and unexpected-null inputs.
2. **Services** — happy path plus conflicts, missing resources, and integration failures.
3. **Authorization** — wrong/no credentials, tampered/expired tokens, and that guards deny.
4. **Error handling** — typed errors map to the right codes/statuses.
5. **Repositories** where behavior is non-trivial (mocking the model).
6. **Components/hooks** for meaningful interaction or logic.

## Mocking conventions

- Mock external boundaries (Mongoose models, Resend, `fetch`); never hit real services.
- Avoid over-mocking: mocks must still let the test fail when business rules break.
- Reset mocks per test (`vi.clearAllMocks()` in `beforeEach`).

## Edge-case expectations

Cover more than the happy path, as relevant:

- Missing, malformed, and invalid input; empty collections and boundary values.
- Unauthorized and wrong-identity access; missing resources; duplicate requests.
- Database/network/provider failures; retries and idempotency.
- Expired/invalid tokens; invalid file types/sizes; race conditions and stale state.

## Authorization & user-isolation testing

- Negative tests must prove a request without a valid admin session is denied (see `token.test.ts`, `credentials.test.ts`).
- When customer accounts and per-user resources arrive, add explicit tests proving user A cannot read/update/delete user B's resources.

## Coverage

- Coverage is configured for `src/backend/**` and `src/common/**` (excluding integration adapters).
- Aim for high branch coverage of security-sensitive logic; do not chase a headline percentage with meaningless tests.
