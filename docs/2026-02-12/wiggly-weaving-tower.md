# Plan: GitHub OAuth Device Flow → Fine-grained PAT 認証への切り替え

## Context

現在 GitMarks は GitHub App の OAuth Device Flow で認証しており、Client ID の管理、トークンリフレッシュ、ポーリングなど複雑なロジックが存在する。これを Fine-grained Personal Access Token (PAT) 入力方式に切り替えることで、認証フローを大幅に簡素化し、GitHub App の依存を排除する。既存ユーザーは再認証が必要になるが許容済み。

## 変更方針

Device Flow 関連のコード（Client ID、ポーリング、トークンリフレッシュ）を全て削除し、PAT をテキスト入力 → `/user` API で検証 → 保存、というシンプルなフローに置き換える。

## 変更対象ファイル

### 1. `lib/storage/index.ts` — AuthData 型の簡素化

- `AuthData` を `{ accessToken: string }` に変更（`refreshToken`, `expiresAt`, `refreshTokenExpiresAt` を削除）

### 2. `lib/github/auth.ts` — 全面書き換え

**削除する関数/定数:**
- `validateEnvVars()` の import と `GITHUB_CLIENT_ID`
- `requestDeviceCode()`
- `pollForToken()`
- `buildAuthData()`
- `startDeviceFlow()`
- `refreshAccessToken()`
- `BUFFER_MS`

**残す関数（簡素化）:**
- `isAuthenticated()` — そのまま
- `getValidToken()` — `getAuthData()` から `accessToken` を返すだけに簡素化（リフレッシュロジック削除）

**新規追加:**
- `validateAndSaveToken(token: string): Promise<GitHubUser>` — `/user` API を呼んで検証し、成功すれば `saveAuthData` + `saveUser` して `GitHubUser` を返す。失敗時はエラーを throw

### 3. `lib/github/schemas.ts` — OAuth スキーマ削除

**削除:**
- `DeviceCodeResponseSchema` / `DeviceCodeResponse`
- `AccessTokenResponseSchema` / `AccessTokenResponse`
- `AccessTokenErrorResponseSchema` / `AccessTokenErrorResponse`

**残す:** `RepositorySchema`, `RepoContentSchema`, `CommitListItemSchema`, `GitHubUserSchema` 等（API 系は全て維持）

### 4. `lib/env/index.ts` — ファイル削除

GitHub App Client ID が不要になるため丸ごと削除。

### 5. `entrypoints/options/hooks/useAuth.ts` — フロー書き換え

**削除:**
- `DeviceFlowInfo` 型
- `deviceFlow` state
- `cancelRef`, `cancelSignIn`
- `startDeviceFlow` import

**変更:**
- `AuthState`: `"pending"` を削除 → `"idle" | "authenticated"` のみに
- `signIn(token: string)`: PAT を受け取り、`validateAndSaveToken()` を呼ぶ。成功で `authenticated`、失敗で `error` をセット
- `restore()`: 起動時の認証復元はそのまま（`getAuthData` → `getUser` → `fetchUser`）

**返り値:** `{ state, user, error, signIn, signOut }`（`deviceFlow`, `cancelSignIn` を削除）

### 6. `entrypoints/options/components/LoginModal.tsx` — PAT 入力 UI に置換

**現在:** Device Flow UI（ユーザーコード表示 + github.com/device リンク + ポーリング待ち）

**変更後:**
- テキスト入力欄（`type="password"` でマスク、`github_pat_` prefix の簡易フォーマットチェック）
- Submit ボタン（バリデーション中は loading 表示）
- Props: `open`, `error`, `loading`, `onSubmit(token: string)`, `onCancel`（`deviceFlow` を削除）

**UI に記載する PAT 設定手順（モーダル内に常時表示）:**
```
Fine-grained personal access token が必要です。

GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
  ① Token name: 任意
  ② Resource owner: 自分のアカウント
  ③ Repository access: GitMarks で使うリポジトリを選択
  ④ Repository permissions:
       - Contents: Read-only   ← 必須（ファイル・コミット読み取り）
       - Metadata: Read-only   ← 自動付与

[Generate token へ →] （外部リンク: https://github.com/settings/personal-access-tokens/new）
```

- Metadata は Contents 権限付与時に自動で Read-only になるため、ユーザーは Contents のみ設定すれば良い旨を UI 上で説明する
- Repository access は「All repositories」でも動作するが、必要なリポジトリのみ選択することを推奨

### 7. `entrypoints/options/App.tsx` — 接続部分の更新

- `useAuth` の destructuring から `deviceFlow`, `cancelSignIn` を削除
- `handleSignIn` → モーダルを開くだけに変更
- 新たに `handleTokenSubmit(token: string)` を追加 → `signIn(token)` を呼び、成功でモーダルを閉じる
- `LoginModal` の props を新しいインターフェースに合わせる

### 8. ビルド・CI 設定のクリーンアップ

- `.envrc.sample` — `WXT_GITHUB_APP_CLIENT_ID` 行を削除
- `.envrc` — `WXT_GITHUB_APP_CLIENT_ID` 行を削除
- `.github/workflows/ci.yaml` — `WXT_GITHUB_APP_CLIENT_ID: dummy` 行を削除

### 9. 変更不要なファイル

- `lib/github/api.ts` — `Authorization: Bearer <token>` は PAT でもそのまま動作する
- `lib/sync/*` — `getValidToken()` のインターフェースが変わらないため影響なし
- `entrypoints/background.ts` — 同上
- `entrypoints/options/hooks/useSync.ts`, `useRepositories.ts` — 同上

## 実装順序

1. `lib/storage/index.ts` — AuthData 簡素化
2. `lib/github/schemas.ts` — OAuth スキーマ削除
3. `lib/env/index.ts` — ファイル削除
4. `lib/github/auth.ts` — 全面書き換え
5. `entrypoints/options/hooks/useAuth.ts` — フロー書き換え
6. `entrypoints/options/components/LoginModal.tsx` — UI 置換
7. `entrypoints/options/App.tsx` — 接続更新
8. ビルド・CI クリーンアップ（`.envrc*`, CI yaml）

## 検証

- `make typecheck` でコンパイルエラーがないこと
- `make lint.fix` で lint エラーがないこと
- `lib/github/auth.ts` から `validateEnvVars`, `GITHUB_CLIENT_ID` への参照が消えていること
- `getValidToken()` が単純に保存済みトークンを返すこと
- LoginModal が PAT 入力フォームになっていること
