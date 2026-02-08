各所にバラバラに定義されているボタンを汎用的な `Button` コンポーネントに切り出し、置き換えて

スタイルの指定には CVA (class-variance-authority) を使用して

## 対象箇所

- レポジトリカード
    - Sync
    - Save
    - Disconnect
- フォルダ選択
    - Refresh
    - Select
- 新規レポジトリモーダル
    - Cancel
    - Next
    - Back
    - Complete
- ヘッダ
    - Sign in
    - Sign out
- その他類似箇所

## サポートすべき状態/props

- kind
    - primary
        - like `Sync`
    - secondary
        - like `Save`
    - text
        - like `Refresh`
- disabled
- dangerous
    - false: default
    - true
        - like `Disconnect`
- icon
- その他必要なもの
