新規レポジトリ連携を追加するモーダルで、設定項目を以下のように2ステップに分けて

- ステップ
    1. レポジトリの選択、source directory の設定
        - 下部には `Next` というボタン (次のステップに進む)
    1. target folder の選択
        - 下部には `Back` ボタン (ステップ1に戻る) と `Complete` ボタン (レポジトリの追加を完了)
        - `FolderSelectPopup` からフォルダツリーを表示している部分だけを `FolderTree` コンポーネントに切り出し、それを表示する
            - `FolderSelectPopup` でも `FolderTree` を使用するようリファクタする
- Ark UI の Step (https://ark-ui.com/docs/components/steps) を使用する
    - モーダルの上部に表示する
    - スタイルは design-principles skill を使用し、既存の UI とスペーシングや配色を合わせる
