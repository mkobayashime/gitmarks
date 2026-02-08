# Privacy Policy for GitMarks

**Last Updated:** February 8, 2026

## Overview

GitMarks is a Chrome Extension that syncs GitHub repository manifest files to Chrome bookmarks. This privacy policy explains what data the extension collects, how it's used, and where it's stored.

## Data Collection and Storage

### What Data We Collect

GitMarks collects and stores the following data **locally on your device only**:

1. **GitHub Authentication Data**
   - GitHub OAuth access token (obtained via GitHub OAuth Device Flow)
   - GitHub user profile information (username, user ID)

2. **Repository Connection Settings**
   - Repository names and owners
   - Source directory paths within repositories
   - Target bookmark folder paths and IDs
   - Connection enabled/disabled status
   - Last sync timestamps
   - Last synced commit SHAs

3. **Bookmark Data**
   - Bookmark names and URLs parsed from manifest files
   - Bookmarklet file contents (when referenced in manifests)

### Where Data Is Stored

**All data is stored exclusively in Chrome's standard storage APIs:**

- **`chrome.storage.sync`**: Connection configurations (repository settings, target folder paths, enabled status)
  - Synced across your browsers where you're signed into Chrome
  - Subject to Chrome's storage quota limits

- **`chrome.storage.local`**: Browser-specific state and authentication data
  - GitHub access token
  - User profile information
  - Folder IDs and sync timestamps
  - Stored locally on each device, not synced

**Important: No data is transmitted to the extension author or any third-party servers operated by the extension author.**

## How Data Is Used

The extension uses your data for the following purposes:

1. **GitHub API Communication**
   - Authenticate with GitHub using your OAuth token
   - Fetch repository contents, commit information, and manifest files
   - All communication is directly between your browser and GitHub's API

2. **Bookmark Management**
   - Parse manifest files to extract bookmark information
   - Create and update bookmarks in your Chrome browser
   - Organize bookmarks into folders matching repository structure

3. **Synchronization**
   - Track last sync timestamps to optimize sync operations
   - Compare commit SHAs to skip unnecessary syncs
   - Maintain connection states across browser sessions

## Third-Party Services

GitMarks communicates with the following third-party services:

1. **GitHub (github.com)**
   - Purpose: OAuth authentication, repository data retrieval
   - Data shared: OAuth token, repository queries
   - Privacy Policy: https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement

**The extension does NOT communicate with:**
- Analytics services
- Tracking services
- Advertising networks
- The extension author's servers
- Any other third-party services

## Data Security

- All authentication tokens are stored securely using Chrome's built-in storage APIs
- OAuth tokens are never exposed to websites you visit
- The extension runs in an isolated environment as per Chrome Extension security model
- Communication with GitHub API uses HTTPS encryption

## Data Retention and Deletion

- Data is retained until you explicitly delete connections or uninstall the extension
- To delete specific connection data: Remove the connection from the extension's options page
- To delete all data: Uninstall the extension from Chrome
- Uninstalling the extension removes all locally stored data

## Your Rights

You have the right to:

- View all stored connection data in the extension's options page
- Delete individual connections at any time
- Revoke GitHub OAuth access via GitHub settings
- Uninstall the extension to remove all data

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last Updated" date at the top of this document. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Open Source

GitMarks is open source software. You can review the source code to verify these privacy practices at: https://github.com/mkobayashime/gitmarks

## Contact

If you have questions about this privacy policy or the extension's data practices, please:

- Open an issue on the GitHub repository
- Contact the author via GitHub
