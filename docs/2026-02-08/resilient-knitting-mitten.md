# Reusable Button Component with CVA - Implementation Plan

## Context

Currently, the GitMarks Chrome Extension has 20+ scattered button implementations across 11 component files, each with inline Tailwind classes. This creates:
- Inconsistent styling patterns
- Difficulty updating button styles globally
- Code duplication across components
- Maintenance burden

This plan consolidates all button implementations into a single, type-safe, reusable component using class-variance-authority (CVA).

---

## Implementation Plan

### Phase 1: Install Dependencies

```bash
bun add class-variance-authority clsx tailwind-merge
```

### Phase 2: Create Button Component Structure

Create new files:
1. `/entrypoints/options/components/ui/utils/cn.ts` - Class merging utility
2. `/entrypoints/options/components/ui/Button/buttonVariants.ts` - CVA configuration
3. `/entrypoints/options/components/ui/Button/Button.tsx` - Main component
4. `/entrypoints/options/components/ui/Button/index.ts` - Exports

### Phase 3: Component API

**Button Variants (kind/size):**
- `kind`: primary | secondary | text | ghost
- `size`: sm | md | lg

**Additional Props:**
- `dangerous`: boolean (false | true) - applies danger styling
- `icon`: ReactElement (leading icon from @primer/octicons-react)
- `trailingIcon`: ReactElement
- `loading`: boolean (shows spinner)
- `unstyled`: boolean (removes all default styles)
- All standard button props (onClick, disabled, type, etc.)

**Key Features:**
- Forward ref support
- Focus-visible ring for accessibility
- Proper aria attributes for loading state
- Compound variants for complex combinations (e.g., primary + danger)

### Phase 4: Migrate Existing Buttons

**Priority Order:**

1. **SyncButton.tsx** - Refactor as thin wrapper around Button (keep for backward compatibility)
2. **ConnectionCard.tsx** - 3 buttons (Save, Disconnect, sync - Sign in required not in scope)
3. **AddConnectionModal.tsx** - 5 buttons (Cancel, Next, Back, Complete, Refresh)
4. **Header.tsx** - 2 buttons (Sign in, Sign out)
5. **FolderSelectPopup.tsx** - 2 buttons (Refresh, Select)
6. **ConnectionList.tsx** - Add repository button (skip - not in scope)
7. **DisconnectConfirmModal.tsx** - 2 buttons
8. **LoginModal.tsx** - 2 buttons
9. **ErrorSection.tsx** - Retry button
10. **FolderTree.tsx** & **RepoCombobox.tsx** - Use `unstyled` prop

### Phase 5: Example Migrations

**SyncButton (keep as wrapper):**
```tsx
// Before: Custom implementation
// After: Wrapper around Button
<Button icon={<SyncIcon />} loading={syncing} disabled={disabled} onClick={onPull}>
  {syncing ? "Syncing…" : "Sync"}
</Button>
```

**ConnectionCard Save button:**
```tsx
// Before: <button className="border border-zinc-700 bg-zinc-800...">
// After:
<Button kind="secondary" disabled={disabled || !connection.enabled} onClick={handleSave}>
  Save
</Button>
```

**Disconnect button:**
```tsx
// Before: <button className="text-red-400 hover:text-red-300...">
// After:
<Button kind="text" dangerous disabled={disabled} onClick={() => setDisconnectOpen(true)}>
  Disconnect
</Button>
```

---

## Critical Files

**New Files to Create:**
- `/entrypoints/options/components/ui/utils/cn.ts`
- `/entrypoints/options/components/ui/Button/buttonVariants.ts`
- `/entrypoints/options/components/ui/Button/Button.tsx`
- `/entrypoints/options/components/ui/Button/index.ts`

**Files to Modify:**
- `/entrypoints/options/components/SyncButton.tsx` - Refactor as wrapper
- `/entrypoints/options/components/ConnectionCard.tsx` - Replace 4 buttons
- `/entrypoints/options/components/AddConnectionModal.tsx` - Replace 5 buttons
- `/entrypoints/options/components/Header.tsx` - Replace 2 buttons
- `/entrypoints/options/components/FolderSelectPopup.tsx` - Replace 2 buttons
- `/entrypoints/options/components/ConnectionList.tsx` - Skip (Add repository button not in scope)
- `/entrypoints/options/components/DisconnectConfirmModal.tsx` - Replace 2 buttons
- `/entrypoints/options/components/LoginModal.tsx` - Replace 2 buttons
- `/entrypoints/options/components/ErrorSection.tsx` - Replace 1 button
- `/entrypoints/options/components/FolderTree.tsx` - Use unstyled variant
- `/entrypoints/options/components/RepoCombobox.tsx` - Use unstyled variant
- `/package.json` - Add dependencies

---

## Verification

After implementation, verify:

1. **Visual consistency**: All buttons match existing styles
2. **All variants work**: primary, secondary, text, ghost with dangerous prop
3. **Loading state**: Spinner appears and button disables
4. **Icons**: Display with proper spacing (gap-1.5)
5. **Disabled state**: Visual opacity + cursor change
6. **Keyboard navigation**: Enter/Space activate buttons
7. **Focus ring**: Visible on keyboard focus
8. **Special cases**: Unstyled variant
9. **No regressions**: All existing functionality preserved
10. **Type safety**: TypeScript compiles without errors

**Run:**
```bash
make typecheck
make lint.fix
# Manual testing in browser
```
