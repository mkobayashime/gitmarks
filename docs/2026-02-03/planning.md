以下の機能を持つ Chrome Extension を実装する計画を立ててください

## 機能の概要

連携された GitHub レポジトリに含まれるファイルを定期的に読み取り、Chrome の bookmarks に同期する  
GitHub レポジトリ上の変更 -> bookmarks への反映のみ行い、bookmarks の変更をレポジトリに反映することは一切行わない

## 要件

- GitHub 連携
    - ユーザ自身の GitHub アカウントでログインし、アクセスを許可するレポジトリを選択できる
    - アクセスを認可されたレポジトリのうち、どのレポジトリを同期に利用するか選択できる
    - 同期するレポジトリに対して、その内容を bookmarks のどのフォルダに同期するかを設定できる (`targetFolder`)
    - 任意個の連携を設定することができる
        - 複数個の連携が設定される場合、同期先フォルダは親子関係にない異なるフォルダであることが必須
- レポジトリ内のファイル解釈
    - 連携に対して同期対象とするレポジトリ上のディレクトリ (`srcDir`) を設定できる
        - e.g. `/src` on the repo
    - `srcDir` 配下のファイルを以下のように検知する
        - ディレクトリ内の `manifest.json` を読み取り、後述のスキーマに沿って解釈する

### `manifest.json` スキーマ

```typescript
type ManifestJSON = Bookmark[]

type Bookmark = {
    name: string
    location: string
}
```

`location` は `https://example.com` のような URL か、ブックマークレットのファイルへのパス (e.g. `./foobar.js`) のいずれか  
ファイルパスであった場合、`manifest.json` の存在するディレクトリからの相対パスとして resolve すること
対応するファイルが存在しない場合、出力される `ManifestJSON` からは取り除くこと

### UI の機能要件

- Options page として実装する
    - `../../entrypoints/options/index.html`, `../../entrypoints/options/index.ts`
- スタック
    - React
    - Tailwind
        - CSS や SCSS (Sass) ファイルは使用しない
    - Headless component library として可能な限り Ark UI を使用する
        - https://ark-ui.com/docs/overview/about
- 機能
    - ログイン状態の表示
        - 未ログインの場合、ログイン導線
        - ログイン済みの場合、ログアウト導線
    - 連携の一覧とそれぞれの設定
        - 未ログインでも連携は存在する可能性があることに留意
            - `chrome.storage.sync` での他デバイスから同期など
        - 各連携について:
            - 同期の有効/無効切り替え
            - レポジトリ名を表示
            - `srcDir` の入力欄
            - `targetFolder` の入力欄
            - Pull ボタン: レポジトリから任意のタイミングで同期
            - 連携解除ボタン
            - 連携・同期のエラー表示 (後述)
    - 連携レポジトリを追加する導線
    - 連携・同期で考慮する例外
        - 指定された `srcDir` がレポジトリに存在しない
        - 指定された `targetFolder` が bookmarks に存在しない
        - 権限不足/ログイン状態が解除されている

## 進め方

以下のうち1のみを遂行すること

1. PoC
    - GitHub との連携部分を実装し、ログイン機構やレポジトリへのアクセス権限認可、レポジトリのファイルへのアクセスが実現可能かを検証する
        - そのレポジトリのルートに存在するファイルの一覧などが出力できれば十分
    - 目的が達成できる最小限の機能のみ実装する計画を立てること

2. 本実装
    - 詳細なプランニングはあとで行う

## タスク遂行上の要件

- GitHub Apps の作成/セットアップなど、human の操作が必要なプロセスについてはその旨明記すること
