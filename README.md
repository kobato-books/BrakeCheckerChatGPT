# 制動力チェック 4.1.0

Updated: 2026-10-27 JST。正式URL: https://brake.kobatobooks.jp/

ユーザーが確認・承認した2026-10-26入力改善試作を採用。入力は軸重を先に、各軸の右→左→左右差、総制動力、サイドの縦順。ラベル左・数値右、自動欄の背景を区別しサイドを測定欄末尾に独立配置。自動フォーカス移動なし。PCのTab順も上から順。

標準結果の5列構成を維持し、大きく表示も同じ一覧を全体拡大。結果と自動表示の数値は3桁区切り。多軸・低速車・被牽引車・N/daN/kN/kgfを維持。

計算式・判定基準・丸め・設定保存・印刷は4.0.0と同じ。初期設定キー brake-check:factory:v2（schema 2）、表示設定キー brake-check:result-display:v1を維持。車両番号・測定値・当日の条件は保存しない。同じ正式URLの保存設定を初期化しない。

PWAはmanifest、standalone、Apple meta、ルートのid/start_url/scopeと既存アイコンを継続。オフラインキャッシュは導入していない。

配信の正本はdist/。GitHubはソース・変更履歴の保管先、実際の公開はSites。brake.kobatobooks.jpは既存本番Sitesへ接続済みでSSLもactive。今回DNS・独自ドメイン・アクセス設定は変更しない。GitHub側のルートソースは従来パスの互換コピーとしてdist/と一致させる。

検証: node test.mjs / node test-workflow.mjs / node test-print.mjs / node test-v3.mjs / node test-half-report.mjs / node test-review.mjs / node test-result-layout.mjs。
baseline/は4.0.0比較用、reference-v3/は以前の実務版3参照用。以前の説明・ソースはGit履歴にも保持。

A4上半分の計算記録票はそのまま。実物印刷・AirPrintは今回未確認。試作は利用者のレビューで承認済み。ブラウザ画面幅検証を実iPhoneでの操作確認とは扱わない。
