# FanBar — 無料・オープンソースの Mac ファン制御

正式ページ：https://getfanbar.com/ja / English: https://getfanbar.com/

FanBar は無料・オープンソース（GPL-3.0）の macOS 用メニューバーアプリです。CPU、GPU、SSD、バッテリーの温度とファン回転数を表示し、回転数の固定や「温度 → 回転数」カーブを設定できます。macOS 11 Big Sur 以降で、AppleSMC からファンのデータを読み取れる Apple シリコン搭載 Mac と Intel Mac に対応しています。

表示言語：English、简体中文、繁體中文、日本語、Русский、Français。「設定 → 一般 → 表示言語」から再起動なしで切り替えられます。

## 機能

- macOS 14 以降で、回転数、CPU 温度、制御モードをデスクトップに表示。更新はシステムが管理します。
- メニューバーに温度と回転数を表示。ファンに合わせて回る 6 種類のアイコン。macOS 14 以降はデスクトップウィジェットも利用可能
- ファンごとの回転数を 0 から最大値までのメーターで表示。CPU、GPU、メモリ、ディスクの負荷グリッドと、直近 10 分間の温度グラフ
- モード：自動、回転数の固定、編集できるカーブを持つ静音・バランス・高性能・最大のプリセット
- カーブの温度ソースは CPU、GPU、SSD から選択
- 任意の高温通知：しきい値 60〜105°C（初期値 90°C）、通知音を選択可能。高温時はワンクリックで最大冷却へ
- CSV ログ：温度、回転数、制御モードを 2〜60 秒ごとに記録
- コマンドラインと Raycast：`fanbar` CLI で状態確認、プリセット切り替え、固定回転数、自動制御への復帰（0.7.0 以降）

## 安全性

- 手動制御は、署名済みヘルパーを macOS で明示的に許可したあとにだけ有効になります。監視にヘルパーは不要です。
- ヘルパー（root）はファンのデータの読み取り、各ファンの範囲内での回転数設定、自動制御への復帰だけを行い、任意の SMC 書き込みはしません。
- アプリの終了、接続の切断、ヘルパーの障害、プリセットの期限切れのときは macOS の自動制御への復帰を試みます。
- 詳細（英語）：https://getfanbar.com/is-fanbar-safe

## ダウンロード

GitHub Releases（https://github.com/helson-lin/FanBar/releases/latest）または Homebrew からのみインストールしてください。

```sh
brew tap helson-lin/fanbar https://github.com/helson-lin/FanBar.git
brew install --cask helson-lin/fanbar/fanbar
```

DMG 版をインストール済みの場合は、FanBar を終了し、既存の /Applications/FanBar.app をゴミ箱に移してから Homebrew でインストールしてください。

ドキュメント：https://github.com/helson-lin/FanBar/blob/main/README.ja.md
