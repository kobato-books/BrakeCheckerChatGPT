# 公開前確認版 UI改修報告

- 対象：制動力チェック・公開前確認版
- URL：https://brake-check-staging.yoshichin-misachin.chatgpt.site
- アプリ版：4.0.0-rc.1（公開前確認版）を維持
- 改修日：2026-10-25
- 本番 appgprj_6ac35871f0188191a59ab32505bdbc20 への保存・配信操作なし

## 保全

改修前に仮公開サイトのソースを同期し、コミット `93bcdf868f25fea39e0da565a2f3daad5f4e2a1f` と一致することを確認。workspace内の `backups/brake-staging-rc1-before-menu-20261025/` に配信ファイル、README、SHA256一覧、ソースZIP、復元用Git bundleを保存。

## 変更ファイル

| ファイル | 変更内容 |
| --- | --- |
| dist/index.html | ヘッダー名を制動力計算に変更、共通PNGアイコン、メニュー用CSS、manifest・favicon・Appleアイコン参照 |
| dist/app.mjs | app-navigation.mjsの読み込みと初期化のみ追加 |
| dist/app-navigation.mjs | 三本線メニュー、4つのアプリ内説明画面、戻る操作とブラウザ履歴、既存説明DOMの移動、更新履歴 |
| dist/app-navigation.css | ヘッダー・メニュー・説明画面・アプリ情報の書式、iPhone幅の調整 |
| dist/app-icon.svg | 指定色・3行の計算結果一覧を表す共通ベクター原稿 |
| dist/icon-180.png、icon-192.png、icon-512.png | 共通原稿から書き出し。ヘッダーとApple用は同じ180px画像 |
| dist/manifest.webmanifest | 名前を制動力計算に統一、更新アイコン参照。start_url・scope・standalone設定は維持 |
| build-app-icons.cjs | PNG画像生成の補助スクリプト |
| serve.cjs | ローカル確認時のSVG MIME形式を追加 |
| check-navigation.cjs | ナビゲーション・本文保持・設定保存・アイコン設定の検証 |
| test-result-layout.mjs | 新規UIモジュールだけを既存処理との比較から除外し、保護対象の一致を検証 |
| README.md、UI-CHANGE-REPORT.md | 改修記録と検証結果 |

## 保護対象

engine.mjs、settings.mjs、元のstyle.css、結果表示・入力フィードバック・表示保存・折りたたみ・印刷モジュールは変更なし。app.mjsは上記UIモジュールのimport・初期化以外が変更前と一致。測定フォームと初期設定フォームのHTMLも同一。

「初めて使う方へ・入力方法」「計算式・端数処理・公式資料」「アプリ情報」は既存DOMをそのまま移動し、移動前後のinnerHTML一致を確認。公式リンク4件のURL・別タブ指定も維持。基準日と自動更新しない旨を含む文章、数値、注意事項は変更していない。

更新履歴は、確認できる公開前確認版の変更だけを記載。不明な過去バージョンの履歴は追加していない。

## 検証結果

- PC 1280px、iPhone相当390px、狭幅320px：ヘッダー重なりなし、ページ横はみ出しなし。
- 三本線メニュー開閉、閉じる・Escape、4ページへの移動、計算画面への復帰、ブラウザの戻る：成功。
- 説明閲覧前後で車両番号・測定値・計算結果・印刷用スナップショットが一致。
- 初期設定の変更・保存・再読み込み、表示方法の保存：成功。
- SVG原稿から180/192/512px出力、ヘッダーPNGの読み込み、Apple180px指定、manifest設定：確認済み。
- 既存計算20ケース・ワークフロー28ケース・実務版3テスト・2列結果対応・合否なし半面印刷データ：成功。
- 既存の画面操作検証、結果修正時の無効化、次の車両、条件開閉：成功。
- A4上半分印刷：収まりとメニュー・説明が印刷に混入しないことを確認。

## 実機確認が必要

iPhone Safariの実際の縦スクロールと戻る操作、ホーム画面への追加とアイコン更新、スタンドアロン起動は未確認。すでに登録したホーム画面アイコンはOS側のキャッシュにより追加し直しが必要になる場合がある。実プリンターの再給紙方向とAirPrintも未確認。

MatchFlowの参考URLは取得できなかったため、他アプリとの完全一致は確認していない。指定されたメニュー表記、Developer/Version/Updatedの項目、落ち着いた余白とアプリ内開閉を既存の制動力チェックのデザインに合わせた。

## 後輪合計・PC配置の追加修正（2026-10-25）
結果左列の右・左制動力の下に『後輪制動力合計』を追加し、右列の後軸制動力計算値と同じ3段目に配置。入力単位Nの場合はNで表示。後輪の右＋左だけを集計し、判定値・比率・端数処理は変更しない。印刷票も同じ表示計画を使うため同欄に合計を表示。PCは851px以上で左入力・右結果、iPhoneは従来の縦並びを維持。PC・390px・320pxで表示と段位置を検証済み。変更ファイル：dist/result-layout.mjs、dist/result-prototype.css、dist/app-navigation.mjs（更新履歴）、テスト・本報告書。


## 標準表示の5行・5列化（2026-10-25）
一般車2軸の標準一覧を、前輪の差→後輪の差→後輪制動力→総合制動力→サイドブレーキの5行に変更。判定項目と計算値の間に、既存判定行のforce値を使ったN値を追加。daN/kNはエンジンが保持するN値を表示し、kgf選択時は単位を偽らずkgf値とする。計算式や換算は追加しない。大きく表示、詳細DOM、印刷票は変更なし。PC・390px・320pxで5列の見出し右端と各値の位置一致・はみ出しなし・詳細展開を確認済み。変更：dist/result-layout.mjs、dist/result-prototype.css、dist/app-navigation.mjs（更新履歴）、check-browser.cjs、本報告書。

