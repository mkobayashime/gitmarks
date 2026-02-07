# Plan: Multi-Step Add Connection Modal

## Context
The current Add Connection modal presents all form fields (repository, source directory, target folder) in a single view. This plan implements a 2-step wizard flow to improve UX by:
- Separating repository setup from folder selection
- Using Ark UI Steps component for visual progress indicator
- Extracting reusable FolderTree component from FolderSelectPopup

## Implementation Plan

### Step 1: Create FolderTree Component
**File:** `entrypoints/options/components/FolderTree.tsx` (new)

Extract the folder tree rendering logic from `FolderSelectPopup.tsx` into a reusable component:

```tsx
type FolderTreeProps = {
  folders: BookmarkTreeFolder[];
  selectedId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectFolder: (id: string) => void;
}
```

**Changes:**
- Extract lines 97-119 (renderTreeRows function) and 141-185 (tree rendering) from FolderSelectPopup
- Keep the same styling: depth-based indentation, expand/collapse icons, selection states
- Remove popup-specific wrapper (absolute positioning, border, shadow)
- Accept `folders` array as prop instead of loading internally

### Step 2: Refactor FolderSelectPopup
**File:** `entrypoints/options/components/FolderSelectPopup.tsx`

Update to use the new FolderTree component:

**Changes:**
- Import FolderTree component
- Replace inline tree rendering with `<FolderTree />` component
- Keep popup container, loading states, refresh button, and Select button
- Pass state handlers (onToggleExpand, onSelectFolder) to FolderTree

### Step 3: Implement Ark UI Steps
**File:** `entrypoints/options/components/AddConnectionModal.tsx`

Refactor modal to use 2-step flow with Ark UI Steps component:

**Structure:**
```tsx
<Steps.Root count={2} step={currentStep} onStepChange={setCurrentStep}>
  <Steps.List>
    <Steps.Item index={0}>
      <Steps.Trigger>
        <Steps.Indicator>1</Steps.Indicator>
      </Steps.Trigger>
      <Steps.Separator />
    </Steps.Item>
    <Steps.Item index={1}>
      <Steps.Trigger>
        <Steps.Indicator>2</Steps.Indicator>
      </Steps.Trigger>
    </Steps.Item>
  </Steps.List>

  <Steps.Content index={0}>
    {/* Repository selection + srcDir input */}
  </Steps.Content>

  <Steps.Content index={1}>
    {/* Target folder selection using FolderTree inline */}
  </Steps.Content>

  {/* Navigation buttons based on currentStep */}
</Steps.Root>
```

**State Changes:**
- Add `currentStep` state (0 or 1)
- Add validation for step 1 before allowing Next
- Add inline folder tree state for step 2 (similar to FolderSelectPopup but embedded)

**Step 1 Content:**
- Repository combobox
- Source directory input
- Next button (validates repo + srcDir)
- Cancel button

**Step 2 Content:**
- Inline FolderTree component (not in popup)
- Back button (returns to step 1)
- Complete button (validates targetFolder and submits)

**Styling (using design-principles):**
- Use existing modal container styling
- Steps indicator at top: small circles with numbers, connected by separator line
- Current step: pink-500 background
- Incomplete step: zinc-700 border, zinc-500 text
- Completed step: pink-500 with checkmark icon
- Consistent spacing: p-6 for modal, mb-4 for sections
- Button styles match existing patterns

### Step 4: Validation Logic
Update validation to work with step flow:

**Step 1 validation (on Next):**
- Repository is selected
- srcDir is valid (using existing `validateSrcDir`)

**Step 2 validation (on Complete):**
- Target folder is selected
- Target folder is not already used by another connection (using existing `validateTargetFolder`)

## Files to Modify

1. **New file:** `entrypoints/options/components/FolderTree.tsx`
   - Reusable folder tree component extracted from FolderSelectPopup

2. **Modify:** `entrypoints/options/components/FolderSelectPopup.tsx`
   - Use FolderTree component internally
   - Simplify tree rendering logic

3. **Modify:** `entrypoints/options/components/AddConnectionModal.tsx`
   - Add Ark UI Steps component
   - Implement 2-step flow with state management
   - Add inline FolderTree for step 2
   - Update validation logic for step transitions

## Key Design Decisions

1. **Inline vs Popup Folder Selection**: Step 2 uses inline FolderTree (not popup) for better UX in wizard flow
2. **FolderTree Reusability**: Extracted component can be used in both modal step and FolderSelectPopup (for future use cases like EditConnectionModal)
3. **Ark UI Integration**: First use of Ark UI in codebase - provides headless Steps component with existing styling
4. **Linear Flow**: User must complete step 1 before step 2 (enforced by Next button validation)

## Dependencies

- `@ark-ui/react` (already installed v5.30.0)
- Existing components: RepoCombobox, FolderSelectPopup
- Existing utilities: validateSrcDir, validateTargetFolder, getFolderTree

## Verification

1. Test step 1 → step 2 flow with valid and invalid inputs
2. Test step 2 → step 1 back navigation
3. Test Complete button validates both steps
4. Test Cancel button closes modal from any step
5. Verify inline FolderTree matches popup functionality (expand/collapse, selection, refresh)
6. Check styling matches existing modal patterns
7. Run `make typecheck` and `make lint.fix`
