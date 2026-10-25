# 制動力チェック 4.0.0

Updated: 2026-10-25 JST。正式版の公開先: https://brake-check-yukiko.yoshichin-misachin.chatgpt.site/

ビルド不要。dist/が配信対象。Sitesの既存プロジェクトと公開URLを継続する。GitHubはソースと履歴の保管先で、自動デプロイ設定は追加しない。

PCは入力・結果の2列、850px以下は縦並び。一般車2軸の標準結果は前輪の差、後輪の差、後輪制動力、総合制動力、サイドブレーキの5行。N値・計算値・基準値・適否を併記。大きく表示では後輪合計を表示。多軸・被牽引車等は対応する項目を維持する。

計算式・判定基準・丸め・換算・初期設定処理は実務版3から変更なし。基準確認日2026-10-05は公開日と区別する。記録簿方式は追加0kg、車検証方式のみ前軸に55kg。左右差の切上げ方式も維持する。

同じ本番URL、localStorageキー brake-check:factory:v2、schema 2を継続し、本番の保存設定を初期化しない。保存は初期設定と表示方法のみ。車両番号・計測値・当日の条件は保存しない。別URLのステージングの設定は転送しない。

PWAはmanifest、standalone、Apple metaと180/192/512pxアイコン、ルートの起動先とscopeを維持。元からオフラインキャッシュはなし。

検証: node test.mjs / node test-workflow.mjs / node test-print.mjs / node test-v3.mjs / node test-result-layout.mjs / node test-half-report.mjs。
ローカル確認: node serve-release.cjs（127.0.0.1:8776）。実務版3参照はreference-v3/。詳細はCHANGELOG.mdとRELEASE-CHECKS-2026-10-25.md。

印刷はA4上半分の計算記録票。合否と基準は載せず、指定整備記録簿の代替ではない。実物印刷・AirPrint・iPhone実機のPWA起動は今回未確認。390pxの表示検証を実Safari検証とは扱わない。

GitHubでは過去のルートのソースパスも互換用に更新し、dist/と同じ内容を保つ。配信の正本はdist/。ルートの旧ファイルを参照するリンクも維持する。
