# Reset Modal States on Close

## Context
The "Add Connection" modal (`AddConnectionModal.tsx`) currently retains all internal states when it closes. When users reopen the modal, they see previously entered values (selected repository, srcDir, target folder, step position, etc.). This creates a confusing UX where stale data persists across modal sessions.

## Problem
States that persist incorrectly:
- `currentStep` - User might be on step 2 when reopening
- `repo` - Previous repository selection remains
- `srcDir` - Custom source directory path remains
- `targetFolderId`, `targetFolderPath` - Previous folder selection
- `error` - Old error messages may persist
- `submitting` - Stuck loading state
- `folders`, `expandedIds`, `selectedFolderId`, `hasLoadedFolderTree` - Folder tree state

## Solution
Use conditional rendering to mount/unmount the modal component, automatically resetting all states.

**Implementation in App.tsx (line 177-184):**
```typescript
{addOpen && (
  <AddConnectionModal
    open={addOpen}
    repos={repos}
    reposLoading={reposLoading}
    existingConnections={connections}
    onAdd={(conn) => void handleAddConnection(conn)}
    onClose={() => setAddOpen(false)}
  />
)}
```

**Why This Approach:**
- **Automatic state reset**: Component unmounts when closed, all state is discarded
- **Simpler**: One-line change vs. 13 lines of manual reset code
- **React idiomatic**: Uses React's lifecycle for cleanup
- **No risk of forgetting**: Future state additions automatically reset
- **The modal already has `if (!open) return null;`** - unmounting is semantically consistent

## Verification Steps

1. **Test Cancel button**:
   - Open modal, select repo, enter srcDir, click Next, select folder
   - Click Cancel
   - Reopen modal
   - **Expected**: All fields reset to defaults, on step 1

2. **Test Complete flow**:
   - Fill out all fields and complete adding a connection
   - Reopen modal
   - **Expected**: All fields reset to defaults, on step 1

3. **Test partial fill**:
   - Open modal, select repo, change srcDir to "/custom"
   - Click Cancel
   - Reopen modal
   - **Expected**: srcDir back to "/", repo cleared, on step 1

4. **Test error state**:
   - Trigger validation error (e.g., try to complete without folder)
   - Click Cancel
   - Reopen modal
   - **Expected**: No error message, clean state

## Files to Modify
- `/Volumes/W/Users/yashime/dev/misc/gitmarks/entrypoints/options/App.tsx` - Wrap AddConnectionModal in conditional rendering (line 177)

1. **Test Cancel button**:
   - Open modal, select repo, enter srcDir, click Next, select folder
   - Click Cancel
   - Reopen modal
   - **Expected**: All fields reset to defaults, on step 1

2. **Test Complete flow**:
   - Fill out all fields and complete adding a connection
   - Reopen modal
   - **Expected**: All fields reset to defaults, on step 1

3. **Test partial fill**:
   - Open modal, select repo, change srcDir to "/custom"
   - Click Cancel
   - Reopen modal
   - **Expected**: srcDir back to "/", repo cleared, on step 1

4. **Test error state**:
   - Trigger validation error (e.g., try to complete without folder)
   - Click Cancel
   - Reopen modal
   - **Expected**: No error message, clean state

## Files to Modify
- `/Volumes/W/Users/yashime/dev/misc/gitmarks/entrypoints/options/components/AddConnectionModal.tsx` - Add reset effect
