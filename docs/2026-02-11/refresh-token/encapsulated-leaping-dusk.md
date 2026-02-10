# Fix: GitHub App トークン8時間失効による 401 Bad credentials

## Context

GitMarks は GitHub App として登録されており、GitHub App の User Access Token は**8時間で失効**する。しかし実装当初は:

- トークンレスポンスの `refresh_token` / `expires_in` を破棄していた（Valibot スキーマに未定義）
- トークンリフレッシュ機構がなかった
- 401 への専用ハンドリングがなかった

結果、サインインから8時間経過後に全 API コールが `401 Bad credentials` で失敗していた。

## Approach

GitHub App の[トークンリフレッシュ API](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens)を使い、期限切れ前に自動でトークンを更新する。

- `POST https://github.com/login/oauth/access_token` に `grant_type: "refresh_token"` でリクエスト
- Device Flow 利用時は `client_secret` 不要（`client_id` + `refresh_token` のみ）
- リフレッシュ時に新しい `refresh_token` も発行される（トークンローテーション）

## Changes

### 1. スキーマ更新 — `lib/github/schemas.ts`

`AccessTokenResponseSchema` に `expires_in`, `refresh_token`, `refresh_token_expires_in` を追加:

```typescript
export const AccessTokenResponseSchema = v.object({
  access_token: v.string(),
  token_type: v.string(),
  scope: v.string(),
  expires_in: v.optional(v.number()),
  refresh_token: v.optional(v.string()),
  refresh_token_expires_in: v.optional(v.number()),
});
```

`optional` にすることで Classic OAuth App への互換性を保つ。

### 2. ストレージ一本化 — `lib/storage/index.ts`

`local:github_access_token`（トークン単体）を廃止し、`local:github_auth_data` にすべての認証情報を統合:

```typescript
export type AuthData = {
  accessToken: string;
  refreshToken?: string;      // GitHub App のみ
  expiresAt?: number;         // Unix timestamp (ms)
  refreshTokenExpiresAt?: number;
};

export const saveAuthData = async (data: AuthData): Promise<void> => { ... };
export const getAuthData = async (): Promise<AuthData | null> => { ... };
export const removeAuthData = async (): Promise<void> => { ... };
```

`refreshToken` / `expiresAt` / `refreshTokenExpiresAt` を optional にすることで、Classic OAuth App（期限なし）でも同じ型を使える。

旧 `saveToken` / `getToken` / `removeToken` は削除。

### 3. 認証フロー更新 — `lib/github/auth.ts`

#### 3a. `pollForToken` の返り値を拡張

```typescript
type AuthResult = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshTokenExpiresIn?: number;
};
```

#### 3b. `buildAuthData()` ヘルパーを追加

`startDeviceFlow` と `refreshAccessToken` の保存ロジックを共通化:

```typescript
const buildAuthData = (
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number | undefined,
  refreshTokenExpiresIn: number | undefined,
): AuthData => { ... };
```

#### 3c. `startDeviceFlow` で `AuthData` を保存

`pollForToken` の結果から `saveAuthData(buildAuthData(...))` を実行。

#### 3d. `refreshAccessToken()` を新規追加

```typescript
export const refreshAccessToken = async (): Promise<string | null> => {
  const authData = await getAuthData();
  if (!authData?.refreshToken || !authData.refreshTokenExpiresAt) return null;

  // Refresh token 自体が期限切れならサインアウト
  if (Date.now() > authData.refreshTokenExpiresAt) {
    await removeAuthData();
    return null;
  }

  // POST https://github.com/login/oauth/access_token
  // body: { client_id, grant_type: "refresh_token", refresh_token }
  // → 新しい AuthData を saveAuthData で保存
  // → 新しい access_token を返す
};
```

#### 3e. `getValidToken()` を新規追加

```typescript
export const getValidToken = async (): Promise<string | null> => {
  const authData = await getAuthData();
  if (!authData) return null;

  if (!authData.expiresAt) return authData.accessToken; // Classic OAuth App — 期限なし

  const BUFFER_MS = 5 * 60 * 1000; // 5分のバッファ
  if (Date.now() < authData.expiresAt - BUFFER_MS) {
    return authData.accessToken; // まだ有効
  }

  return await refreshAccessToken();
};
```

### 4. トークン取得箇所の更新

`getToken()` → `getValidToken()` に変更（`lib/github/auth.ts` からインポート）:

| ファイル | 変更内容 |
|---------|---------|
| `lib/sync/sync-all.ts` | `getToken()` → `getValidToken()` |
| `entrypoints/options/hooks/useSync.ts` | `getToken()` → `getValidToken()` |
| `entrypoints/options/hooks/useRepositories.ts` | `getToken()` → `getValidToken()` |

以下は変更しない（存在チェックのみ）:
- `isAuthenticated()` — `getAuthData() !== null` に変更済み
- `useAuth.ts` の `restore()` — `getAuthData()` に変更済み

### 5. サインアウト時のクリーンアップ — `entrypoints/options/hooks/useAuth.ts`

`removeToken()` + `removeAuthMetadata()` → `removeAuthData()` に統一。
`restore` の catch 節も同様。

## Migration

ストレージキーが `local:github_access_token` → `local:github_auth_data` に変わるため、既存ユーザーは**一度だけ再サインインが必要**。

- 旧キーのトークンは参照されなくなり、サインアウト状態として扱われる
- 再サインイン後は `AuthData` 形式で保存され、以降は自動リフレッシュが機能する

## Verification

1. `make typecheck` が通ること
2. サインインして `chrome.storage.local` に `github_auth_data` が保存されていることを DevTools で確認
3. 手動テスト: DevTools で `expiresAt` を過去の値に書き換え → Pull ボタン押下 → 自動リフレッシュされて sync 成功
4. リフレッシュトークンも無効にした場合 → `null` が返り、UI がサインアウト状態になること
