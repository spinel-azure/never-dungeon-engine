# Never Dungeon Engine (NDE)

Never Dungeon Engine（NDE）は、ブラウザ上で動作する3DダンジョンRPG制作のためのプロトタイプエンジンです。
現在は、10×10のセル境界壁式ダンジョンをランダム生成し、疑似3D視点で探索できる基盤部分を開発しています。

## スクリーンショット

<p align="center">
  <img src="images/screenshots/nde_ss_01.avif" width="260" alt="スマホ表示">
  <img src="images/screenshots/nde_ss_02.avif" width="520" alt="PC表示">
</p>

<p align="center">
  <b>スマホ、タブレットやPCなど、デバイスに応じた表示が可能</b>
</p>

## 概要

NDEは、クラシックな3DダンジョンRPGの探索体験をHTML / CSS / JavaScriptのみで実装することを目的としています。
セル自体はすべて床として扱い、セル境界に壁を持たせる方式により、小さなマップでも探索可能な床面積を確保します。

将来的には、商人、回復の泉、宝箱、ランダムエンカウント、ボス部屋、階段、アイテム、モンスターなどを追加し、DRPG制作の土台として発展させる予定です。

## 現在の主な機能

- レイキャスト式の疑似3Dダンジョン描画
- 10×10セルのランダム迷路生成
- 全100セルが到達可能なダンジョン生成保証
- セル境界線方式の壁管理
- 前進、後退、左右旋回
- 移動・旋回アニメーション
- 探索済み範囲だけ表示されるミニマップ
- 未探索範囲のノイズ表示
- スタート地点までのオート帰還
- 踏破済みセルのみを通る帰還ルート探索
- ランダム生成ボタンによる再生成
- PC / タブレット / スマホ向けのデバイス判定基盤
- レスポンシブUI基盤
- ゲーム用フォント管理
- `file://` 直開き用のバンドルスクリプト対応

## 技術構成

- HTML
- CSS
- JavaScript
- ES Modules
- Canvas 2D API
- 外部ライブラリなし
- ビルド環境なし

通常のWebサーバー環境では `js/main.js` を `type="module"` で読み込みます。
ローカルの `file://` 直開き環境では `js/main.bundle.js` を読み込みます。

## フォルダ構成

```text
index.html

css/
  style.css

js/
  main.js
  main.bundle.js
  config.js
  dungeon.js
  player.js
  renderer.js
  minimap.js
  input.js
  autoReturn.js
  events.js
  device.js

fonts/
  DotGothic16-Regular.woff2
  DotGothic16-Regular.ttf
  k8x12.woff2
  k8x12.ttf

images/
  walls/
  floors/
  ui/
  items/
  monsters/
  effects/

bgm/
se/
data/
```

## 開発ステータス

現在はプロトタイプ段階です。
3Dダンジョン探索エンジンとしての基礎機能を整備している途中で、ゲーム本編の戦闘、イベント、アイテム、モンスター、シナリオなどは今後実装予定です。

## GitHub Pagesでの公開について

NDEは静的ファイルのみで構成されているため、GitHub Pagesでの公開を想定しています。
GitHub Pages上では `index.html` からES Modules版の `js/main.js` を読み込んで動作する想定です。
