# React and TypeScript style guide

Follow these rules as written. The examples all use one subject, a Regions table with a
searchable tree, so they read as a single codebase.

## 1. Formatting

Formatting is automated. Run Prettier and ESLint; never hand-format and never hand-sort
imports. The settings, for reference:

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
region-table/
  RegionTable.tsx
  AddColumnForm.tsx
  regionTable.types.ts
  regionTable.constants.ts
  atoms/regionTableAtoms.ts
  hooks/useRegionEditor.ts          composition root
  hooks/useRegionData.ts            one concern each
  hooks/useRegionSave.ts
  hooks/useRegionSync.ts
  hooks/useRegionSave.test.ts       tests sit beside the code
  queries/useRegionDataQuery.ts
  mutations/useBulkUpdateRegionsMutation.ts
  utils/getSelectionState.ts
  utils/getSelectionState.test.ts
  utils/validateNewColumn.ts
```

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
- A nullable value uses `Maybe<T>` (`T | undefined | null`) where the project defines it,
  rather than spelling out the union each time.

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
- Handlers the hook returns are wrapped in `useCallback` with a complete dependency array.
  Handlers used only inside the hook are plain functions.
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
- The one exception is an Immer reducer, where the parameter is named `draft` and assigned
  directly. Brace every case; throw in `default`:
  ```ts
  export const regionNodeReducer = (draft: RegionNodeStateT, action: RegionNodeActionT) => {
    switch (action.type) {
      case "setEditMode": {
        draft.inEditMode = action.payload;
        break;
      }
      case "cancelChanges": {
        draft.title = draft.originalTitle;
        draft.inEditMode = false;
        break;
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
- Derived data is computed (`useMemo`, a derived atom, a selector). Never store it in a
  second piece of state that has to be kept in sync.

## 8. Components

```tsx
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
}: RegionPickerPropsT) => {
  if (!regions.length) {
    return <EmptyState>No regions</EmptyState>;
  }

  return <Wrapper className={className}>...</Wrapper>;
};

const Wrapper = styled.div`
  min-width: 0;
`;
```

- Props are destructured in the signature, defaults in the destructuring. Required props
  first, optional next, callbacks last.
- `export const`, arrow function. Never `React.FC`.
- `styled-components` definitions go at the bottom of the file, after the component. The
  outermost is `Wrapper`; the rest are named for their role (`TableContent`, `ResetButton`).
- Colors and spacing come from CSS variables (`var(--color-primary)`). No hard-coded hex in
  a styled block. Local layout values are custom properties on the wrapper:
  ```ts
  const Wrapper = styled.div`
    --name-column-width: 312px;
    display: grid;
    grid-template-columns: var(--name-column-width) 1fr;
  `;
  ```
- Target a UI library's class names from inside the styled wrapper, not by overriding the
  library theme globally.
- Accept and forward `data-testid` on components that tests drive.
- Guard clauses first, then the main return. No nested ternaries in JSX; lift the condition
  into a named boolean above the return.
- A component needing a provider exports a thin wrapper that renders the provider around a
  `...Content` component holding the logic.

## 9. Data fetching and mutations

- One file per query in `queries/`, one per mutation in `mutations/`.
- The request itself is a module-level `const` async function with positional arguments,
  returning the typed body. The hook wraps it.
- Query keys live in an exported object, so invalidation uses the same literal:
  ```ts
  export const regionQueryKeys = {
    regionTableData: "regionTableData"
  };
  ```
- The query hook takes a params object with `enabled`, optional `onSuccess` / `onError`, and
  a `queryConfig` passthrough that omits the keys the hook controls:
  ```ts
  queryConfig?: Omit<
    UseQueryOptions<RegionTableDataT, unknown>,
    "queryKey" | "queryFn" | "enabled" | "onSuccess" | "onError"
  >;
  ```
- `enabled` includes the preconditions: `enabled: enabled && !!regionSet && !!filterId`.
- The hook returns a narrowed object, not the library's whole result, so callers do not
  depend on the data library:
  ```ts
  return {
    data: queryInfo.data,
    error: queryInfo.error,
    isError: queryInfo.status === "error",
    isLoading: queryInfo.status === "loading",
    isFetching: queryInfo.isFetching,
    refetch: queryInfo.refetch
  };
  ```
- A mutation's `onSuccess` invalidates and refreshes what depends on it, then calls the
  caller's `onSuccess` last.
- Check size and other limits before sending, with the limit named and the failure shown to
  the user.

## 10. Errors and user feedback

A failed write reports three ways: captured with context, shown to the user, and returned to
the caller.

```ts
onError: (error) => {
  const message = extractErrorMessage(error);

  Sentry.captureException(error, {
    tags: { component: "RegionTable", action: "save" },
    extra: { regionSet }
  });

  setValidationError(message);
  toast.error(message);
}
```

- `handleSave` returns `Promise<boolean>`. The component decides whether to close.
- Turning a transport error into a user-facing message is its own documented utility, with
  the precedence order in the docblock and a named `fallback` parameter.
- Messages are complete sentences that say what to do next, not status codes.

## 11. Docblocks and comments

- Every exported function, hook, atom, and non-obvious type gets a `/** ... */` docblock.
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

- Vitest or Jest with React Testing Library. `renderHook` and `act` for hooks.
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
- Always cover: empty input, a single item, a duplicate, surrounding whitespace, and a
  mixed-type collection.
- Mock only the boundary (a data hook, a network module), never the unit under test. Declare
  mocks at the top, each with a one-line comment naming what it stands in for.
- No snapshot tests.

## 13. Checklist

1. Every export is `export const` with an arrow function, no `export default`.
2. Every type is a `type` ending in `T`. No `interface`, no `any`.
3. Exported functions have an explicit return type and a docblock naming the constraint a
   caller could get wrong.
4. Logic worth testing is in an exported pure function, not inside a hook body.
5. No input is mutated, except an Immer `draft`.
6. Handlers returned from a hook use `useCallback` with a complete dependency array, and
   `exhaustive-deps` is clean or the omission is explained.
7. The hook returns one flat object, last in the body.
8. Magic numbers are named constants with the reason in a comment.
9. Styled components are at the bottom; colors come from CSS variables.
10. Test file beside the code, names are verb phrases, empty case covered, whole result
    shapes asserted.
11. Prettier and ESLint pass.
