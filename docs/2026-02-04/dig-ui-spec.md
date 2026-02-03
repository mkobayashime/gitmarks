# UI 仕様: Options Page

> `planning.md` の「UI の機能要件」に基づき、インタラクション・レイアウト・例外ケースを具体的に定義するドキュメント。

---

## 技術スタック

- **React** (コンポーネント)
- **Tailwind CSS** (スタイリング。CSS/SCSS ファイルは使用しない)
- **Ark UI** (Headless コンポーネント。Toggle, Dialog, Combobox, Select, Toast Provider を使用)

---

## 全体レイアウト

```
┌─────────────────────────────────────────────┐
│  Header                                     │
│    [GitMarks]        [👤 user] [Sign out]   │
│    or                                       │
│    [GitMarks]        [Sign in]              │
├─────────────────────────────────────────────┤
│                                             │
│  [Connection A (expanded)]                  │
│  [Connection B (compact)]                   │
│  [Connection C (compact)]                   │
│  [+ Add repository (placeholder)]           │
│                                             │
└─────────────────────────────────────────────┘
```

- ページ全体は単一カラム・垂直スクロール
- ヘッダーは固定（`sticky top-0`）
- 連携カード一覧とプレースホルダーは順列で配置

---

## 1. ヘッダー

| 状態 | 表示 |
|------|------|
| 未ログイン | アプリ名 + `Sign in` ボタン |
| ログイン済み | アプリ名 + ユーザー名（アバター）+ `Sign out` ボタン |

- `Sign in` ボタン → デバイスフローのモーダルを開く（後述: §4）
- `Sign out` ボタン → トークン削除・状態リセット・カード一覧は維持（未ログイン時の表示になる）

---

## 2. 連携カード

各連携は「展開カード」で表現する。デフォルトでコンパクト（閉じた状態）で表示され、クリックで展開する。

### 2.1 コンパクト状態

```
┌──────────────────────────────────────────┐
│ ▶  owner/repo-name                       │
│    ● Active  ○ Disabled                  │
│    Last synced: 2026-02-04 10:30         │
└──────────────────────────────────────────┘
```

- リポジトリ名（`owner/repo`）を表示
- 同期ステータスインディケータ（● Active / ● Error / ○ Disabled）
- 最後の同期日時（未同期の場合は `Never synced` と表示）
- エラーがある場合はカード全体の左端に赤いボーダーを付与

### 2.2 展開状態

```
┌──────────────────────────────────────────┐
│ ▼  owner/repo-name                       │
│                                          │
│  [Toggle: Enabled ●]                     │
│                                          │
│  srcDir                                  │
│  ┌──────────────────────────┐            │
│  │ /src                     │            │
│  └──────────────────────────┘            │
│                                          │
│  Target folder                           │
│  ┌──────────────────────────┐            │
│  │ Bookmarks > Dev ▼        │            │
│  └──────────────────────────┘            │
│                                          │
│  [Pull]              [Disconnect]        │
│                                          │
│  Last synced: 2026-02-04 10:30           │
│                                          │
│  ─── Errors ─────────────────────        │
│  ⚠ srcDir "/src" does not exist ...      │
└──────────────────────────────────────────┘
```

#### 各要素の仕様

| 要素 | 詳細 |
|------|------|
| **トグルスイッチ** | Ark UI `Toggle`。オン/オフで即時 `chrome.storage` に保存（オートセーブ）。オフの場合は `Pull` ボタンを無効化し、srcDir・targetFolder のインプットも無効化する |
| **srcDir 入力欄** | プレーンなテキスト入力。プレースホルダーは `/`。リポジトリルート(`/`)も有効な値。値変更後は `Save` で明示的に保存する（§3.3 参照） |
| **Target folder ドロップダウン** | Ark UI `Select`。オプションは Chrome bookmarks の全フォルダを階層パス（`Bookmarks > A > B`）で表示。`Bookmarks root` も選択可能 |
| **Pull ボタン** | 同期実行ボタン。実行中は Ark UI `Spinner` に切り替え（再クリック不可）。完了後は元のボタンに戻り、トーストで結果通知 |
| **Disconnect ボタン** | クリックで確認モーダルを開く（§5） |
| **Last synced** | 同期成功時に日時を更新。未同期の場合は `Never synced` と表示 |
| **エラーセクション** | エラーが発生した場合のみ表示。複数エラーがある場合はリスト表示 |

### 2.3 未ログイン時の連携カード

- カード自体は表示する（他デバイスで同期された連携が存在する可能性がある）
- トグル・srcDir・targetFolder・Pull ボタン・連携解除は全て無効化（`disabled`）
- カード内に `Sign in required` チップを表示し、クリックでヘッダーの `Sign in` と同じフローを開始する

---

## 3. 連携の追加（プレースホルダーカード）

### 3.1 プレースホルダー

連携カード一覧の末尾に「＋ リポジトリを追加」のプレースホルダーカードを表示する。

```
┌──────────────────────────────────────┐
│                                      │
│         +  Add repository            │
│                                      │
└──────────────────────────────────────┘
```

- クリック → 連携追加モーダルを開く（§4）
- 未ログインの場合も表示するが、クリック時はログインモーダルを先に開く

### 3.2 連携追加モーダル

クリック時に以下モーダルを開く。モーダル内で全設定を行い、「追加」で連携を作成する。

```
┌─────────────────────────────────────┐
│  Add new connection                 │
│                                     │
│  Repository                         │
│  ┌─────────────────────────────┐    │
│  │ Search repositories... ▼    │    │
│  └─────────────────────────────┘    │
│  ↓ Results filter as you type       │
│  ┌─────────────────────────────┐    │
│  │ owner/repo-a                │    │
│  │ owner/repo-b                │    │
│  └─────────────────────────────┘    │
│                                     │
│  srcDir                             │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Target folder                      │
│  ┌─────────────────────────────┐    │
│  │ Bookmarks ▼                 │    │
│  └─────────────────────────────┘    │
│                                     │
│  ⚠ Error message (if any)           │
│                                     │
│  [Cancel]                [Add]      │
└─────────────────────────────────────┘
```

- **Repository combobox**: Ark UI `Combobox`。入力と同時に一覧をフィルタリング（クライアント側マッチング）
  - リポジトリ一覧のロード中は `Loading...` を表示
  - リポジトリが 0 件の場合：
    - ログイン済みの場合: `No repositories found. Create one on GitHub.`
    - スコープ不足の場合: `Repository access permission required`
  - 未ログインの場合: モーダルを開く直前に `Sign in` モーダルを表示し、ログイン完了後に再開する
- **srcDir**: プレーンテキスト入力（必須）
- **Target folder**: Ark UI `Select`（必須）
- **Add ボタン**: 必須フィールドが全て埋まっているときのみ有効。クリック時は §3.3 のバリデーションを実行

### 3.3 保存時バリデーション

「追加」または展開カード内の設定変更で保存を行う際、以下のチェックを実行する。エラーの場合は操作を中断し、カード内エラーセクション（追加モーダルの場合はモーダル内）に表示する。

| チェック | エラーメッセージ |
|---------|----------------|
| srcDir が空文字列 | `srcDir is required` (`/` は有効) |
| targetFolder が未選択 | `Target folder is required` |
| targetFolder が他の連携と重複（同一・親子関係） | `This folder conflicts with another connection. Choose a different folder.` |

- **トグルの有効/無効は即時保存**（バリデーション対象外）
- srcDir・targetFolder の変更は `Add` ボタン（モーダル時）または `Save` ボタン（展開カード時）の押下で保存

---

## 4. ログインモーダル（デバイスフロー）

ヘッダーの `Sign in` ボタン・未ログインカードの `Sign in required` チップ・プレースホルダーの未ログイン時クリック、いずれかで開く。

```
┌─────────────────────────────────────┐
│  Sign in with GitHub                │
│                                     │
│  Enter this code at                 │
│  github.com/device                  │
│                                     │
│  ┌─────────────┐                    │
│  │  ABCD-EFGH  │                    │
│  └─────────────┘                    │
│                                     │
│  [Open github.com/device]           │
│                                     │
│  ── Waiting for authorization... ── │
│                                     │
│  [Cancel]                           │
└─────────────────────────────────────┘
```

- ユーザーコードを大きく表示
- `Open github.com/device` ボタンで認証URL を新タブで開く
- ポーリングで認証完了を待機。完了時はモーダルを閉じ、ヘッダーを ログイン済みに遷移
- `Cancel` でポーリングを停止・モーダルを閉じる
- タイムアウト時は `Authorization timed out. Please try again.` を表示

---

## 5. 連携解除の確認モーダル

展開カードの `Disconnect` ボタン → 以下モーダルを開く。

```
┌─────────────────────────────────────┐
│  Disconnect this connection?        │
│                                     │
│  This will remove the connection    │
│  and sync data for owner/repo-name. │
│  This action cannot be undone.      │
│                                     │
│  [Cancel]         [Disconnect]      │
└─────────────────────────────────────┘
```

- Ark UI `Dialog`
- `Disconnect` ボタンは赤色で強調（破壊的操作であることを視覚的に示す）
- `Disconnect` クリック → 連携データを `chrome.storage` から削除 → モーダルを閉じ → カード一覧から削除

---

## 6. Pull 操作のフロー

```
[Pull]
    │
    ▼ click
[Button → Spinner (re-click disabled)]
    │
    ├── Success
    │     ▼
    │   Spinner → Pull button restored
    │   Card: "Last synced" updated to current time
    │   Toast: "Synced N bookmarks"
    │
    └── Failure
          ▼
        Spinner → Pull button restored
        Card: error section updated with message
        Toast: "Sync failed"
```

- 同期中のカードは他の操作（Pull・トグル・設定変更）を無効化
- エラーセクションは次回の Pull 成功時にクリアされる

---

## 7. トースト通知

- Ark UI `Toast` を使用
- ページ右下に表示
- 表示時間: 約 4 秒で自動消滅

| イベント | メッセージ | タイプ |
|---------|-----------|--------|
| Pull 成功 | `Synced N bookmarks` | success |
| Pull 失敗 | `Sync failed` | error |
| 連携追加成功 | `Connection added` | success |
| 連携解除完了 | `Connection removed` | info |

---

## 8. エラーセクション（カード内）

エラーが発生した場合のみ表示される。

| エラー種別 | 表示メッセージ |
|-----------|--------------|
| srcDir が存在しない | `srcDir "${value}" does not exist in this repository` |
| targetFolder が存在しない | `Target folder does not exist` |
| 権限不足 / 認証切れ | `Sign in required. Please sign in again.` |
| targetFolder 衝突 | `This folder conflicts with another connection` |
| その他の同期エラー | `Sync failed: {error message}` |

- エラー行に `Retry` リンクを付与（Pull を再実行する）
- 複数エラーの場合はリスト表示

---

## 9. Ark UI コンポーネント対応一覧

| Ark UI コンポーネント | 使用箇所 |
|----------------------|---------|
| `Toggle` | 連携カード内の有効/無効切り替え |
| `Dialog` | 連携追加モーダル・ログインモーダル・削除確認モーダル |
| `Combobox` | リポジトリ選択（モーダル内） |
| `Select` | 同期先フォルダ選択（モーダル内・展開カード内） |
| `Toast` | 操作結果の通知 |
| `Spinner` | Pull ボタンの実行中状態 |
