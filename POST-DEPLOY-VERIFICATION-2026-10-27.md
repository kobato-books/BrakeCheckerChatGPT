# 4.1.0 公開後確認 — 2026-10-27

正式URL: https://brake.kobatobooks.jp/
GitHubソース記録: 664aac23e20e3c1bc52ad95c703bb28ec84d4218
Sitesソース: 2470f0d19bf7bcb2a7050e791a601e5ca99e0930
Sites保存版5、デプロイappgdep_6adf720737548191b860932316b72cacがsucceeded。

独自ドメインから全25配信ファイルを取得し、公開候補と一致。HTML末尾に自動追加されるCloudflareスクリプトは区別した。GitHub origin/mainを再取得し、dist/25件とルート互換コピー25件の計50件が公開候補にバイト一致することを確認。

本番ブラウザで、入力欄が前軸重→後軸重→前右→前左→後右→後左→サイドの順であること、自動左右差・総制動力、標準と拡大一覧、15,200Nと3,400Nの独立表示、Version 4.1.0とUpdated 2026-10-27を確認。390pxで5行表示・横はみ出しなし。

公開後も独自ドメインのstatus active、ssl_status activeを読み取り再確認。既存Sites接続を利用しており、GitHub Pages・DNS・ドメイン・公開範囲の設定変更なし。GitHubはソース保存、公開はSitesである。

計算・初期設定・印刷の保全テストは公開前に通過。実物印刷・AirPrintは今回未確認。試作レビューの承認と実機検証の範囲を混同しない。以前のSites保存版4は復元用に保持。
