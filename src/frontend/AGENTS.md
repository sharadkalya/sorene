# `src/frontend` — Client UI

Extends the root `AGENTS.md`. Everything here is browser UI.

## Rules

- **DaisyUI is the design system.** Use `btn`, `card`, `input`, `badge`, `navbar`, `alert`, `stats`, etc. before custom markup. No second component library.
- **Forms.** Labeled fields use a `div flex flex-col gap-2` wrapper with a `span text-sm font-medium` label above a plain `input`/`select`/`textarea` (there is no `-bordered` suffix in v5); checkbox/toggle rows use `label` + `input` + `span`. Avoid daisyUI 4 `form-control`/`label-text`/`*-bordered`. `fieldset` + `fieldset-legend` exists in v5 but its label→input gap is too tight here — prefer the `div` pattern.
- **Theme-aware classes only.** Use `bg-base-100`, `text-base-content`, `text-primary`, `border-primary/20`, etc. Never hardcode colors or `bg-white`/`text-black`/`border-gray-*` for theme-dependent UI.
- **Components** are small and reusable; `components/` holds shared UI, `features/<area>/` holds page-level UI. Prefer composition over giant page components.
- **Identifiable class names** for custom styling: BEM-style (`product-card__price`) via CSS Modules, or a stable root class when global CSS is needed. Keep DaisyUI alongside custom CSS — don't replace it.
- **Data flows in via props.** Server Components in `src/app` fetch data and pass it down. Do not fetch on mount with `useEffect` (repo ESLint forbids sync `setState` in effects). Use `router.refresh()` to re-run the server component.
- **State:** React state for local UI; URL params for navigation; Redux Toolkit (`src/frontend/store/`) is available for shared client state (cart/checkout) when a feature needs it — use the typed hooks from `store/hooks.ts`. Do not cache server data in a client store without a documented reason.
- Loading, error, empty, and success states must all be handled explicitly. Use stable keys; no `any`.
- Client components that fetch server data on user action may call the API routes; those requests carry the HttpOnly admin cookie automatically (same-origin).

## Spacing

Keep breathing room consistent so UI never looks cramped or patchy. One spacing mechanism per axis — never stack two.

- **Containers carry `gap`, children don't carry margins.** Separate siblings with the parent's `gap-*`/`space-y-*`, not a chain of `mb-*`/`mt-*` on each child. A parent `gap` combined with child margins double-spaces.
- **Buttons always have padding.** DaisyUI `btn` handles this; any custom/anchor button must set `px-*`/`py-*` (or use `btn`/`btn-square`/`btn-circle`). No zero-padding click targets.
- **Form fields: label above control, spaced apart.** Every `input`/`select`/`textarea` gets a `label` (DaisyUI `label` already pads); separate fields with `gap-*`/`mt-*` on the wrapping container. Never flush a control against its label.
- **Use the scale, not arbitrary values.** Stick to Tailwind steps (`gap-2`–`gap-8`, `p-4`–`p-8`, `mb-8`/`py-12`); avoid one-off `gap-[7px]`/`m-[13px]`. Keep horizontal and vertical gaps comparable.
- **Menus & nav items** get `gap-*` between items and padded hit areas (`px-* py-*`); never bare zero-padding menu links.
- **Edges never touch.** Cards, tables, and page sections get real padding — content must not sit flush against borders or the viewport edge.
