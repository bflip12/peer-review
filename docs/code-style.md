# React and TypeScript style guide

Follow these rules as written. The examples all use one subject, a Regions table with a
searchable tree, so they read as a single codebase.

## 1. Formatting

Formatting is automated. Run Prettier, ESLint, and Stylelint; never hand-format and never
hand-sort imports. ESLint and Stylelint enforce most of the mechanical rules in this guide
and fail on warnings (ADR 0021); this guide gives the reasons and covers what they cannot
check. The Prettier settings, for reference:

- `printWidth: 90`, `tabWidth: 2`, spaces, LF endings
- double quotes, semicolons, no trailing commas
- `arrowParens: "always"`: `(value) => value * 2`
- `bracketSameLine: true`, so a multi-line JSX open tag closes on the last prop line:
  ```tsx
  <Dropdown.Button
    onClick={onClick}
    placement="bottomRight"
    trigger={["click"]}>
    {children}
  </Dropdown.Button>
  ```

Imports are grouped and sorted by a Prettier import-sort plugin. Add the import anywhere
and let the formatter place it.

## 2. Files and folders

A feature is a folder. One concern per file. One exported function per file in `utils/`.

```
src/app/regions/page.tsx              route files only: they compose features
src/features/region-table/
  RegionTable.tsx                     server component, reads data
  RegionTable.module.css
  RegionTableEditor.tsx               "use client" leaf
  AddColumnForm.tsx                   "use client", submits an action
  regionTable.types.ts
  regionTable.constants.ts
  data/getRegionTable.ts              server-only read, takes the Supabase client
  data/getRegionTable.db.test.ts      runs against the local stack
  actions/addColumn.ts                "use server", one action per file
  schemas/addColumnSchema.ts          Zod schema for the action's input
  hooks/useRegionEditor.ts            composition root
  hooks/useRegionSelection.ts         one concern each
  hooks/useRegionSelection.test.ts    tests sit beside the code
  utils/getSelectionState.ts
  utils/getSelectionState.test.ts
```

- Features live in `src/features/<feature>/`. `src/app/` holds route files only.
  Shared Supabase code lives in `src/lib/supabase/`.
- Folder names are kebab-case. Component and type files are PascalCase or camelCase after
  what they export.
- A hook large enough to need helpers gets its own folder, with its helpers and its types
  beside it: `hooks/searchable-tree/useSearchableTree.tsx`,
  `hooks/searchable-tree/utils/deriveCheckState.ts`,
  `hooks/searchable-tree/searchableTree.types.ts`.
- Shared types go in `<featureName>.types.ts`. Types used by one file stay at the top of
  that file.
- Constants go in `<featureName>.constants.ts`.
- `utils/`, never `util/`.
- No barrel files. Import from the module that defines the thing. A barrel hides the
  dependency graph and makes a circular import easy to create by accident.

## 3. Naming

| Thing | Pattern | Example |
|---|---|---|
| Component | PascalCase | `RegionTable`, `AddColumnForm` |
| Hook | `useThing` | `useRegionEditor` |
| Type | PascalCase, `T` suffix | `RegionRowT`, `TreeNodeT` |
| Props type | `<Component>PropsT` | `RegionPickerPropsT` |
| Hook params type | `Use<Hook>ParamsT` | `UseRegionSaveParamsT` |
| Hook return type | `Use<Hook>ReturnT` | `UseRegionEditorReturnT` |
| Event handler | `handleX` | `handleAddColumn`, `handleKeyDown` |
| Callback prop | `onX` | `onRegionSelect`, `onCheckedKeysChange` |
| Boolean | `isX`, `hasX`, `canX` | `isSearching`, `hasAllChildrenChecked`, `canDrop` |
| Pure getter | `getX` | `getSelectionState` |
| Predicate | `isX`, `looksLikeX` | `isFolderNode`, `looksLikeHtml` |
| Computed next state | `next`, `nextX` | `const next = new Map(current)` |
| Module constant | SCREAMING_SNAKE | `MAX_PAYLOAD_BYTES`, `DEFAULT_DEBOUNCE_MS` |
| Test fixture | `mockX` | `mockRegion`, `mockEmptyFolder` |

- Names say what the thing is, not how it is used: `getSelectionState`, not `doSelection`.
- Magic numbers become named constants in the module that owns them, with the reason in a
  comment: `// 50MB, matching the backend limit`.
- `null` and `undefined` mean different things, so a type never allows both. A value from
  the database that is not set is `T | null`, as the generated types and
  `docs/DATA_MODEL.md` have it. A prop or argument the caller may leave out is optional,
  `name?: T`. No `Maybe<T>` type: it hides which of the two a value is, and every caller
  ends up checking for both.

## 4. Types

- Use `type`, not `interface`. Every type name ends in `T`.
- Type-only imports use `import type`.
- Never `any`. Use `unknown` with a narrowing check, or type the shape.

```ts
export type RegionRowT = {
  id: string;
  name: string;
  values: Record<string, string>;
  /** Unit of measure for the column, when the column declares one */
  unit?: string;
  /** Inferred from the data, not returned by the API */
  valueType?: "number" | "string";
};
```

- A field whose name does not explain it gets a one-line docblock, as above.
- Reducer actions are a discriminated union, one line per action:
  ```ts
  export type RegionNodeActionT =
    | { type: "acceptChanges" }
    | { type: "cancelChanges" }
    | { type: "setEditMode"; payload: boolean }
    | { type: "setTitle"; payload: string };
  ```
- Closed sets that appear in UI logic are a union of string literals, with a docblock
  naming each member's effect:
  ```ts
  /**
   * Which rows a column filter shows.
   *
   * - "all": every row
   * - "withValue": rows that have a value in this column
   * - "withoutValue": rows that do not
   */
  export type ColumnFilterT = "all" | "withValue" | "withoutValue";
  ```
- Constant lookup maps get `Readonly<Record<...>>` or `as const`:
  ```ts
  const STATUS_MESSAGES: Readonly<Record<number, string>> = {
    413: "The file is too large to upload."
  };
  ```
- Derive from one source instead of restating: `BulkUpdateRequestT["updates"]`,
  `TreeProps["onExpand"]`, `Required<Pick<TreeProps, "checkedKeys" | "onCheck">>`.

## 5. Function signatures

Everything is `export const` with an arrow function. No `export default`, no
`export function`.

A function with three or more arguments, and every hook, takes one object. Declare its
type, destructure in the signature, put defaults there:

```ts
export type UseSearchableTreeParamsT = {
  tree: TreeNodeT[];
  checkedKeys: string[];
  onCheckedKeysChange: (checkedKeys: string[]) => void;
  debounceMs?: number;
};

export const useSearchableTree = ({
  tree,
  checkedKeys,
  onCheckedKeysChange,
  debounceMs = DEFAULT_DEBOUNCE_MS
}: UseSearchableTreeParamsT): UseSearchableTreeReturnT => {
  ...
};
```

A small pure utility takes positional arguments, two at most:

```ts
export const collectLeafKeys = (tree: TreeNodeT[]): string[] => { ... };

export const deriveCheckState = (fullTree: TreeNodeT[], selected: Set<string>): CheckStateT => { ... };
```

Write the return type on every exported function. Leave it to inference on local closures.

## 6. Hooks

One hook per concern, then a composition root that wires them together and returns a flat
object. The component does not know how many hooks are behind it.

```ts
/**
 * Coordinates data fetching, state synchronization, saving, and reset for the Regions
 * table.
 */
export const useRegionEditor = ({
  regionSet,
  isVisible,
  isClosing
}: UseRegionEditorParamsT): UseRegionEditorReturnT => {
  const data = useRegionData({ regionSet, isVisible });
  const save = useRegionSave({ regionSet, isVisible });
  const reset = useRegionReset();
  useRegionSync({ regionSet, isVisible });

  return {
    // Hidden while closing after a save, so the spinner does not flash
    isLoading: data.isFetching && !isClosing,
    isSaving: save.isSaving,
    validationError: save.validationError,
    handleSave: save.handleSave,
    resetAllState: reset.resetAllState,
    refetch: data.refetch
  };
};
```

- Body order: state, refs, effects, handlers, derived values, return.
- The return is a flat object literal, last in the body.
- The React Compiler memoizes components and hooks (ADR 0021). Do not add `useMemo` or
  `useCallback` for performance. Use them only when a value's identity matters outside
  render: an effect dependency that must not change every render, or a function that must
  be created once, such as a debounced one.
- Keep `react-hooks/exhaustive-deps` enabled. Fix each warning on its merits: add the
  dependency, move the value into a ref, or extract the function. When a dependency is
  deliberately left out, say why on that effect.
- A debounced function is created once with `useMemo` and cancelled on unmount:
  ```ts
  // Created once per delay. A new debounced function on every render would reset the
  // timer on every keystroke, and the filter would never run while the user types.
  const updateQueryDebounced = useMemo(() => debounce(setQuery, debounceMs), [debounceMs]);
  useEffect(() => () => updateQueryDebounced.cancel(), [updateQueryDebounced]);
  ```
- An effect synchronizes with something outside React: a browser API, a subscription, a
  timer. It is not for values computed from props or state (compute them during render) or
  for responding to a user action (do that in the event handler). `react-hooks` reports
  `setState` called directly in an effect. This follows React's "You Might Not Need an
  Effect".
- Use a ref to mirror a value only when a callback would otherwise close over a stale copy.
  Keep the mirror in one effect and state what it is for.
- Native listeners needing `{ passive: false }` are added in an effect and removed in its
  cleanup, using the same function reference for both.

## 7. Pure functions and state updates

- Logic worth testing lives in an exported pure function outside the hook. The hook calls
  it. This is what keeps the tests short:
  ```ts
  export const validateNewColumn = (
    columns: ColumnT[],
    name: string
  ): { isValid: boolean; newColumn?: ColumnT } => { ... };

  export const addColumn = (columns: ColumnT[], column: ColumnT): ColumnT[] => { ... };

  export const removeColumn = (columns: ColumnT[], name: string): ColumnT[] => { ... };
  ```
- Never mutate an input. Build the next value and return it: `const next = new Map(current)`,
  `return [...columns, column]`, `return columns.filter((c) => c.name !== name)`.
- A `useReducer` reducer returns a new state for every action. Brace every case; throw in
  `default`:
  ```ts
  export const regionNodeReducer = (
    state: RegionNodeStateT,
    action: RegionNodeActionT
  ): RegionNodeStateT => {
    switch (action.type) {
      case "setEditMode": {
        return { ...state, inEditMode: action.payload };
      }
      case "cancelChanges": {
        return { ...state, title: state.originalTitle, inEditMode: false };
      }
      default: {
        throw new Error("invalid region node reducer action");
      }
    }
  };
  ```
- Membership tests build a `Set` first, then filter. Keyed accumulation uses a `Map`.
- Recursive tree work is a named inner function whose return value is documented:
  ```ts
  /**
   * Single recursive pass, bottom up.
   * Returns true when this node and all its descendants are checked.
   */
  const processNode = (node: TreeNodeT): boolean => { ... };
  ```
- Derived data is computed (during render, or with `useMemo` when it is expensive). Never
  store it in a second piece of state that has to be kept in sync.

## 8. Components and styling

Components are server components unless they need the browser. A client component starts
with `"use client"` and sits at the smallest leaf that needs state, effects, or event
handlers. ADR 0019 explains the choices in sections 8 to 10.

```tsx
import styles from "./RegionPicker.module.css";

export type RegionPickerPropsT = {
  regions: RegionT[];
  selectedId?: string;
  isDisabled?: boolean;
  className?: string;
  onRegionSelect: (id: string) => void;
};

export const RegionPicker = ({
  regions,
  selectedId,
  isDisabled = false,
  className,
  onRegionSelect
}: RegionPickerPropsT): ReactElement => {
  if (!regions.length) {
    return <EmptyState>No regions</EmptyState>;
  }

  return <div className={cx(styles.wrapper, className)}>...</div>;
};
```

```css
/* RegionPicker.module.css */
.wrapper {
  --name-column-width: 312px;
  display: grid;
  grid-template-columns: var(--name-column-width) 1fr;
  gap: var(--space-2);
  color: var(--color-text);
}
```

- Props are destructured in the signature, defaults in the destructuring. Required props
  first, optional next, callbacks last.
- `export const`, arrow function. Never `React.FC`. Route files (`page.tsx`, `layout.tsx`,
  `loading.tsx`, `error.tsx`, `not-found.tsx`) use `export default`, because Next.js
  requires it; the component is still a named arrow function exported at the bottom.
- Styles live in a CSS Module beside the component, `<Component>.module.css`. The
  outermost class is `wrapper`; the rest are named for their role (`tableContent`,
  `resetButton`).
- Colors, spacing, and type come from the token variables (`var(--color-text)`). No color
  value in a module. Local layout values are custom properties on the wrapper, as above.
- The only global CSS is the token file and the reset, imported by the root layout.
- A value known only at render time is passed as a custom property, never as a style:
  `style={{ "--progress": `${percent}%` }}`.
- React 19: `ref` is a regular prop, typed in the props type; never `forwardRef`. A
  context is rendered as its own provider, `<ThemeContext value={theme}>`, not
  `<ThemeContext.Provider>`.
- List keys are stable ids from the data, never the array index. An index key gives a row
  another row's state when the list is filtered or reordered.
- The left side of `&&` in JSX is a boolean. `{count && <Badge />}` renders `0` when
  `count` is zero; write `{count > 0 && <Badge />}`.
- Route files type their props with the generated helpers, `PageProps<"/venues/[id]">` and
  `LayoutProps<"/">`, which `npm run typecheck` generates. `params` and `searchParams` are
  promises; await them inside the `<Suspense>` boundary that needs them.
- Guard clauses first, then the main return. No nested ternaries in JSX; lift the condition
  into a named boolean above the return.
- Props passed to a client component are sent to the browser. Pass only the fields it
  renders, never a whole row that holds fields the viewer may not see.

## 9. Data, actions, and state

### Reading

- Server components read data by calling functions in the feature's `data/` folder. Never
  fetch in `useEffect`.
- A data function starts with `import "server-only"`, takes the Supabase client as its
  first argument, and returns typed rows. Taking the client lets the app call it as the
  signed-in user and database tests call it as a test user:
  ```ts
  /**
   * The regions in one set, ordered by name. RLS decides which rows the client sees.
   */
  export const getRegionTable = async (
    supabase: SupabaseClientT,
    regionSetId: string
  ): Promise<RegionRowT[]> => { ... };
  ```
- A component that reads cookies, the signed-in user, or other request data sits inside
  `<Suspense>` with a fallback the size of the content. The build fails otherwise.
- Data is read per request. Do not wrap a Supabase read in `use cache` without an ADR:
  cached code cannot read cookies, and on Vercel the cache does not persist across
  requests (ADR 0019).
- Start independent reads together (`Promise.all`, or sibling `<Suspense>` boundaries), so
  one slow read does not hold up the others.

### Writing

- Writes are server actions, one per file in the feature's `actions/` folder, starting
  with `"use server"`.
- A server action is a public endpoint. Every action, in this order:
  1. parses its input with the Zod schema from `schemas/`,
  2. checks who is calling, when the action needs a signed-in user,
  3. writes through the signed-in user's Supabase client, so RLS applies (never the
     service role key),
  4. calls `refresh()` to show the change, or `redirect()` to move on,
  5. returns an `ActionResultT`.
  ```ts
  export type ActionResultT<DataT = undefined> =
    | { ok: true; data: DataT }
    | { ok: false; message: string; fieldErrors?: Record<string, string[]> };
  ```
- Forms call actions through `useActionState`, which gives the result and a `pending`
  flag. Check limits in the schema, with the limit named in the message.
- `useOptimistic` shows a change before the action finishes (likes, follows).

### Where state lives

| State | Where |
|---|---|
| Data from the database | Read on the server, passed down as props. Never copied into client state |
| Filters, tabs, sort, page | The URL search params, so a view can be shared and reloaded |
| UI-only state (open, editing, draft text) | `useState` or `useReducer` in the client component that needs it |
| A change waiting on the server | `useOptimistic` |

No global client store. React context only for small cross-cutting UI state, such as a
theme. A store or a client data library needs an ADR and a screen that requires it.

## 10. Errors, loading, and user feedback

- **Expected failures** (invalid input, a name already taken, a cap reached) are returned
  from the action as `{ ok: false, message }` and shown beside the field or the form. They
  are never thrown.
- **Unexpected failures** are thrown. The route segment's `error.tsx` catches them. It is
  a client component that shows a plain message and a button that calls `retry()`. Errors
  from the server reach it as a generic message with `error.digest`, which matches the
  server log; never show `error.message` from the server.
- **Missing entities** call `notFound()`, and `not-found.tsx` renders the page.
- **Loading:** each data section has its own `<Suspense>` fallback, sized like the content
  so the page does not jump. `loading.tsx` covers a whole route only when nothing on it
  can render without data.
- **Logging:** log unexpected server errors with `console.error`, with the action and the
  ids involved, never the user's private content. Error monitoring is decided at launch.
- Messages are complete sentences that say what to do next, not status codes.

## 11. Docblocks and comments

- Every exported function, hook, action, and non-obvious type gets a `/** ... */`
  docblock.
- The docblock says what the thing is for and the constraint a caller could get wrong:
  ```ts
  /**
   * Works out which nodes render checked and half-checked while a search is active.
   *
   * Always call this with the full tree, not the filtered one. Leaves hidden by the search
   * still count: filtering changes what is displayed, not the answer. A folder is checked
   * when every leaf under it is selected, half-checked when some are, unchecked when none.
   */
  ```
- Multi-rule behaviour is a bullet list. Use a numbered list when the order is the rule:
  ```ts
  /**
   * Resolves a row's style.
   *
   * 1. A summary row uses its configured style, falling back to the DEFAULT constants.
   * 2. With the override off, the style from the API is used.
   * 3. With the override on, the current custom style is used.
   */
  ```
- Use `@param` and `@returns` only when the names do not already say it.
- Inline comments give the reason a line exists:
  ```ts
  // Wait for the grid to render the new column before scrolling to it
  window.setTimeout(() => { ... }, 150);
  ```
- State known limits where the code is:
  ```ts
  // Adding rows is not implemented yet
  const newRows: BulkUpdateRequestT["newRows"] = [];
  ```
- Do not restate the language. No `// loop over the columns`.

## 12. Tests

A test file sits beside every non-trivial module.

- Vitest with React Testing Library. `renderHook` and `act` for hooks.
- Async server components are not rendered in unit tests; React Testing Library does not
  support them. Keep them thin: test their data functions in `*.db.test.ts` files against
  the local stack (`npm run test:db`), their logic in pure functions, and the page with
  Playwright.
- `describe` names the unit. Nest a second `describe` per behaviour area when a file covers
  several.
- A test name is a verb phrase stating the behaviour. No "should".
  ```ts
  describe("getSelectionState", () => {
    it("returns only the folder id when every child is checked", () => {});
    it("returns individual region ids when some children are checked", () => {});
    it("ignores folder keys, so a stale key cannot mark a folder checked", () => {});
  });
  ```
- Fixtures are `const mockX` at the top of the file or the top of the `describe`, fully
  typed, one per shape being exercised: `mockRegion`, `mockFolder`, `mockEmptyFolder`,
  `mockFolderWithNestedSource`.
- Body is arrange, act, assert, separated by blank lines, with one `const result =` call:
  ```ts
  it("returns only the folder id when every child is checked", () => {
    const tree = [mockFolderWithTwoRegions];
    const checkedKeys = ["folder-north", "region-site-a", "region-site-b"];

    const result = getSelectionState(checkedKeys, tree);

    expect(result.folderIds).toEqual(["folder-north"]);
    expect(result.regionIds).toEqual([]);
  });
  ```
- Assert the whole result shape, including the fields that should stay empty. That is what
  catches logic leaking between branches.
- Test exported pure functions directly. The hook test then covers wiring and state
  transitions only.
- Always cover: empty input, a single item, a duplicate, and surrounding whitespace.
- Mock only the boundary (a data hook, a network module), never the unit under test. Declare
  mocks at the top, each with a one-line comment naming what it stands in for.
- No snapshot tests.

### Querying the page

Tests find elements the way a user does, so a test that passes means the page works for
people using a screen reader too. Use Testing Library's query priority:
1. `getByRole` with the accessible name: `getByRole("button", { name: "Save log" })`.
2. `getByLabelText` for form fields.
3. `getByText` for content that is not interactive.
4. `getByTestId` only when none of these can tell the element apart. Add `data-testid`
   for that one test; components do not carry test ids by default.

Interact with `@testing-library/user-event`, not `fireEvent`, so a click also focuses and
a typed value fires every key event. It is added with the first test that clicks or types.
`eslint-plugin-testing-library` reports the common mistakes.

### End-to-end tests

Playwright tests in `e2e/` follow Playwright's best practices:
- Locators are user-facing: `page.getByRole`, `getByLabel`, `getByText`. No CSS or XPath
  selectors.
- Assertions are web-first and wait on their own: `await expect(locator).toBeVisible()`.
  Never `page.waitForTimeout`.
- Each test creates the data it needs and does not depend on another test having run.
- A test checks one user journey ("signs in and logs a night"), named like a unit test.
- `eslint-plugin-playwright` reports missing `await`s and the other common mistakes.

## 13. Accessibility

Pages meet WCAG 2.1 AA. The colors are checked by `src/styles/tokens.test.ts`, focus by
the reset, and `eslint-plugin-jsx-a11y` reports the markup mistakes it can see. The rest:
- The native element first: `<button>` for actions, `<a href>` for navigation, `<label>`
  for fields, `<ul>` for lists. ARIA only for what HTML cannot say (`aria-pressed` on a
  toggle button, `aria-live` for a status that changes).
- Every page has one `<h1>`, and headings go down one level at a time.
- Every input has a visible `<label>`. Help text and errors are linked with
  `aria-describedby`, and an invalid field sets `aria-invalid`.
- Everything works with the keyboard alone, in a sensible order, with no `tabIndex`
  greater than 0.
- An icon or star with no text gets an accessible name, or is hidden with
  `aria-hidden="true"` when text beside it says the same (the rating pattern in
  `docs/style-guide.md`).
- Color never carries meaning alone. An error has text, not only a red border.

## 14. Checklist

1. Every export is `export const` with an arrow function, no `export default`, except in
   route files, which Next.js requires to `export default`.
2. Every type is a `type` ending in `T`. No `interface`, no `any`.
3. Exported functions have an explicit return type and a docblock naming the constraint a
   caller could get wrong.
4. Logic worth testing is in an exported pure function, not inside a hook body.
5. No input is mutated.
6. No `useMemo` or `useCallback` for performance, and `exhaustive-deps` is clean or the
   omission is explained.
7. The hook returns one flat object, last in the body.
8. Magic numbers are named constants with the reason in a comment.
9. Styles are in a CSS Module beside the component, colors come from token variables, and
   client components are leaves that receive only the fields they render.
10. Test file beside the code, names are verb phrases, empty case covered, whole result
    shapes asserted.
11. Tests query by role, label, or text; a test id only when nothing else works.
12. Native elements, a label on every input, and the page works with the keyboard.
13. `npm run lint` and `npm run format:check` pass.
