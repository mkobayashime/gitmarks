同期設定しているレポジトリについて、その設定を `chrome.storage.local` ではなく `chrome.storage.sync` に保存し、同一の Google アカウントでログインしているブラウザ間で同期されるように改修して

ただしブックマークの同期処理自体は各ブラウザで独立に実行されるべきなので、同期の状態管理用の情報 (e.g. `lastSyncedAt`) はは引き続き `chrome.storage.local` に残す必要があることに注意して
