# PoC 検証結果

## 検証対象と結果

以下を PoC で検証した。すべて問題なく動作した。

| 検証項目 | 方法 | 結果 |
|---------|------|------|
| GitHub OAuth 認証 | Device Flow | ✅ Chrome Extension から直接実行可能。backend 不要 |
| アクセストークンの永続化 | WXT の `storage` API (`chrome.storage.local`) | ✅ Extension の再起動をまたいで維持される |
| ユーザーのレポジトリ一覧の取得 | `GET /user/repos` | ✅ private レポジトリを含む一覧を取得できる |
| レポジトリ内のファイル一覧の取得 | `GET /repos/{owner}/{repo}/contents/{path}` | ✅ ルートディレクトリのファイル・サブディレクトリを取得できる |
| Options ページの表示と遷移 | WXT の `entrypoints/options/` | ✅ React コンポーネントとして動作する |

## 技術的な決定と理由

### OAuth: Device Flow を選択

- `client_secret` を一切使わない。Extension のコード中にシークレットが含まれない
- backend サーバーを必要としない
- GitHub の Device Flow エンドポイント (`/login/device/code`, `/login/oauth/access_token`) は CORS をサポートしているため、Extension から直接 `fetch` で呼び出せる
- ポーリングによるトークン取得の実装は簡単で信頼性が高い

### OAuth スコープ: `repo`

PoC では `repo` スコープを使用した。これにより public・private の両方のレポジトリへのアクセスが可能になる。
本実装で必要なスコープの見直しは「本実装で対応すること」に記載する。

### トークン保存先: `chrome.storage.local`

WXT の `storage` API を使用し `local:` プレフィックスで保存した。
Extension のコンテキストに閉じ込められているため、他のサイトやタブからアクセスは不可。

## PoC で検証しなかった項目（本実装で対応すること）

### レポジトリ内の manifest.json の読み取りと解釈

PoC では `/contents` エンドポイントでファイル一覧を取得するのみで停止した。
`manifest.json` の実際の内容を読み込む場合は、同じ `/contents/{path}` エンドポイントで対象ファイルを取得し、レスポンスの `content` フィールド（base64 エンコード）をデコードすると内容を得られる。

```
GET /repos/{owner}/{repo}/contents/{path}/manifest.json
→ レスポンスの `content` フィールドが base64 エンコードされた内容
```

### ブックマーク操作

PoC では Chrome の bookmarks API には触れていない。
本実装で `chrome.bookmarks` API を使用し、targetFolder へのブックマーク作成・更新・削除を実装する。
そのためには `bookmarks` パーミッションを追加する必要がある。

### 定期的な同期

PoC では手動でリポジトリを選んでファイル一覧を表示するのみで、定期的な読み取りは実装していない。
本実装で `chrome.alarms` API を使用し、定期的に sync を実行する仕組みを導入する。
そのためには `alarms` パーミッションを追加する必要がある。

### 複数レポジトリの連携管理と syncDir・targetFolder 設定

PoC では単一レポジトリの表示のみ対応した。
本実装で以下を導入する：

- 任意個の連携（レポジトリ + srcDir + targetFolder）を管理する
- 複数連携の同期先フォルダが親子関係にないことを検証する
- これらの設定を `chrome.storage` に永続化する

## PoC で発見した技術上の注意点

| 項目 | 詳細 |
|------|------|
| `browser` vs `chrome` | WXT は `browser` グローバルを提供する。`chrome.*` API は使わず `browser.*` を使うこと |
| `storage` グローバル | WXT の `storage` は自動インポートされるグローバルだが、Biome はそれを認識しない。`biome.json` の `javascript.globals` に `storage` を追加した |
| `/contents` のレスポンス形状 | ディレクトリの場合は配列を返す。ファイルの場合は単一オブジェクトを返す。取得後に配列に正規化する必要がある |
| Options ページの開出先 | `index.html` に `<meta name="manifest.open_in_tab" content="true" />` を付けると Options ページがタブで開く |
| Client ID の管理 | `lib/env/index.ts` で `import.meta.env.WXT_GITHUB_APP_CLIENT_ID` を読み取り検証する。Extension のビルド時に WXT が環境変数を埋め込む。`auth.ts` はこちらから取得し、直接ハードコードしない |

## PoC のコード構成

```
lib/
  env/
    index.ts   # 環境変数の検証と公開（WXT_GITHUB_APP_CLIENT_ID）
  github/
    types.ts   # GitHub API レスポンス型の定義
    auth.ts    # Device Flow の実装（requestDeviceCode, pollForToken, startDeviceFlow）
    api.ts     # GitHub API クライアント（fetchUserRepos, fetchRepoContents）
  storage/
    index.ts   # トークン保存ユーティリティ（saveToken, getToken, removeToken）
entrypoints/
  options/
    index.html # Options ページエントリ
    main.tsx   # React エントリポイント
    App.tsx    # メインコンポーネント（3状態: idle / pending / authenticated）
    style.css  # スタイル
```
