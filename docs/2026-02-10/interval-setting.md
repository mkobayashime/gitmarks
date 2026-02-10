options page に設定用のセクションを追加し、sync interval の設定をユーザーが自由に設定できるようにして

- 設定 UI は既存の connection cards の下に "Settings" セクションとして作成する
- 設定は `chrome.storage.sync` に保存する
    - key name は既存の storage values に合わせて命名する
- "Sync interval (in minutes)" という項目で設定を追加する
    - Ark UI の Number Input を使用する
        - min={20}
- ユーザーが設定を変更していない場合のデフォルト値を60分に変更する
