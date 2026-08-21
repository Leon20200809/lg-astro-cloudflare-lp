# 02_LG_PROJECT_INITIAL_FLOW

# LG流｜新規開発プロジェクト初期設計テンプレート

> **最小で動かす → 全体像を掴む → 1機能ずつ縦切り → 型でGOALを固定 → テスト合格 → 次へ進む**
> 
> 
> ChatGPT / Codex / Claude / Gemini など、AIへ新規プロジェクトの進め方を共有するための共通指示書。
> 

---

## 0. この文書の目的

新しい開発プロジェクトを始めるとき、いきなり大量のコードを書かない。

最初に以下を決める。

```
何を実現したいか
↓
データがどこから来るか
↓
どんな完成データが欲しいか
↓
どの部隊が何を担当するか
↓
最小の1本を動かす
↓
テスト
↓
次の1機能
```

AIには「完成コードを一気に出す」のではなく、**全体像 → 小ステップ → 実装 → 確認**の順で進めさせる。

---

# 1. 最初に「やりたいこと」を日本語1文にする

まずプロジェクトの仕事を、日本語1文で定義する。

例:

```
Webページの商品情報を取得し、
指定フォーマットへ変換して、
Google Sheetsへ保存する。
```

```
Sheetsの生情報を読み、
指定プロンプトと一緒にAIへ渡し、
回答を指定セルへ書き込む。
```

この1文から外れる仕事は、初期MVPには入れない。

---

# 2. 全体のデータフローを先に描く

コードより先に「データの旅」を書く。

例:

```
外部データ
↓
取得
↓
RawData
↓
加工
↓
ProcessedData
↓
外部API
↓
ResultData
↓
保存
```

CopyPaste Destructor系なら:

```
Mercari DOM
↓
MercariItem
↓
ResearchSheetRow
↓
Google Sheets
↓
ResearchSourceRow
↓
Gemini
↓
ResearchAttributes
↓
Google Sheets
```

この図を見れば、どこに型・worker・テストが必要か判断できる。

---

# 3. MVPの境界を明示する

「今どこまで作るか」を先に止める。

```
今回やる
├─ 1件取得
├─ 1件加工
├─ 1件保存
└─ 成功確認

今回やらない
├─ 一括処理
├─ 自動実行
├─ リトライ
├─ CI/CD
├─ 管理画面
└─ 高度な例外処理
```

最初から全部作らない。

---

# 4. 型 = 欲しい完成データ = 部隊の納品規格

LG流では、型は単なるTypeScriptの文法ではない。

```
型
=
「この部隊から何を受け取りたいか」
=
完成成果物の契約
```

例:

```tsx
export type ResearchSourceRow = {
  title: string;
  description: string;
};
```

これは、

> 「Sheets読み取り部隊は、title と description を完成成果物として返せ」
> 

という契約。

次:

```tsx
export type ResearchAttributes = {
  brand: string | null;
  material: string | null;
  model: string | null;
};
```

これは、

> 「AI解析部隊は、この形で納品せよ」
> 

というGOAL。

---

# 5. フォルダ設計は「部隊の住所」を決める作業

初期段階で、コードを書く前に責務の住所を決める。

```
project/
├─ src/
│  ├─ main.ts
│  ├─ config/
│  ├─ types/
│  ├─ workers/
│  ├─ prompts/
│  ├─ features/
│  └─ helpers/
├─ tests/
├─ package.json
├─ tsconfig.json
├─ .gitignore
└─ README.md
```

## `main.ts`

**司令官。**

細かい仕事はしない。

```tsx
function execute(): void {
  const source = readSource();
  const result = processSource(source);
  writeResult(result);
}
```

日本語で言えば:

```
読め
↓
加工せよ
↓
書け
```

司令官がAPI仕様・DOM構造・列番号・JSON変換などを知り始めたら、workerへ逃がす。

## `workers/`

具体的な仕事を担当する実働部隊。

1ファイル1責務を基本にする。

```
read-research-source-row.ts
request-research-attributes-from-gemini.ts
write-research-attributes.ts
```

各ファイルの仕事は日本語1文で説明できること。

## `types/`

各部隊の納品規格。

```
RawItem
ProcessedRow
ApiResponse
ResearchAttributes
```

型を見ればデータフローが読める状態を目指す。

## `config/`

固定値・接続先・列定義など。

```tsx
export const SHEET_CONFIG = {
  spreadsheetId: "...",
  sheetName: "research",
  columns: {
    title: 4,
    description: 24,
    outputStart: 11,
  },
} as const;
```

worker内へマジックナンバーを散らさない。

## `prompts/`

AIプロンプトはAPI通信コードから分離する。

```
生データ
↓
buildPrompt()
↓
プロンプト
↓
AI API
```

プロンプト改善時に通信コードを触らずに済む。

## `features/`

複数workerをまとめる機能単位。
単一workerで済む段階では無理に作らない。

## `helpers/`

最初から空フォルダを作らない。
複数箇所で本当に再利用される処理が出た時だけ追加する。

---

# 6. 最初の実装は「最小の縦切り」

横に全部作らない。

悪い例:

```
全画面作る
↓
全API作る
↓
全DB作る
↓
最後に接続
```

LG流:

```
1件読む
↓
1件加工
↓
1件保存
↓
成功確認
```

例:

```
2行目だけ読む
↓
Geminiへ1回送る
↓
JSONを受け取る
↓
K〜Vへ1行だけ書く
```

---

# 7. 外部サービスは「疎通確認」を先にする

新しいAPI・CLI・DB・サーバーを使う時は、本処理より先に配線確認。

```
接続できる
↓
読める
↓
書ける
```

を先に証明する。

例:

```
ローカル
↓
clasp push
↓
GAS
↓
console.log
```

その後:

```
GAS
↓
Google Sheets
↓
getName()
```

その後:

```
GAS
↓
Google Sheets
↓
テストセルへ書き込み
↓
元へ戻す
```

---

# 8. 読み取り → 書き込みの順

外部データを扱うときは、

```
接続
↓
read
↓
確認
↓
write
```

の順で進む。

書き込み試験では:

```
空きセルへ仮値
↓
読み戻して確認
↓
finally で元へ戻す
```

を使う。

---

# 9. 推測で埋めない

取得できた事実と推論結果を分ける。

```
RawData
= 事実

ProcessedData
= 確実な変換

AI Result
= 推論
```

AIへは、

```
判断できない
↓
null
```

を明示する。

---

# 10. APIキー・秘密情報をコードに書かない

```
Git管理する
├─ APIキーの名前
├─ config
└─ 接続ロジック

Git管理しない
├─ APIキー本体
├─ client secret
├─ OAuth token
└─ credential JSON
```

値は環境変数・Secret・Script Propertiesなどへ置く。

---

# 11. 設定ファイルは必ず読む

新しいツールを導入したら、設定ファイルを「意味不明な生成物」にしない。

例: clasp

```
~/.clasprc.json
= 誰としてGoogleへ接続するか

.clasp.json
= どのローカルを、どのGASへ送るか

appsscript.json
= GASをGoogle上でどう動かすか
```

---

# 12. CLIコマンドは最初に手で打つ

自動化前に必ず一度手動で通す。

```
手動
↓
意味を理解
↓
npm script
↓
CI/CD
```

例:

```
clasp push
```

を理解してから、

```json
{
  "scripts": {
    "update": "clasp push && clasp open-script"
  }
}
```

へまとめる。

さらに理解してから、

```
git push
↓
GitHub Actions
↓
build
↓
clasp push
```

へ進む。

---

# 13. Gitは節目ごとにセーブ

「次の未知領域へ入る直前」をセーブポイントにする。

```
DOM取得成功
↓
commit

Sheets書き込み成功
↓
commit

Gemini導入前
↓
commit

TypeScript化前
↓
commit
```

コミットメッセージは「何ができるようになったか」を日本語で書く。

---

# 14. READMEは現時点の地図

最低限:

```
目的
現在できること
現在のデータフロー
ディレクトリ構造
主な型
実行方法
セキュリティ
現在のMVP境界
次にやること
```

---

# 15. デバッグ用装備は捨てずに収納する

一時的に使った便利機能を本番フローへ残し続けない。
再利用価値があるなら部品化して収納する。

```
本番UI
└─ シートへ登録

開発ツール
├─ JSONコピー
└─ DOM HTML保存
```

必要時だけ:

```tsx
initDeveloperTools();
```

---

# 16. 司令官スクリプトを肥大化させない

目安:

```
main.ts / popup.ts
= できれば200行以内
```

判断基準:

> **これは本当に司令官が知るべき情報か？**
> 

DOM selector、API endpoint詳細、認証処理、セル番号、JSON解析、文字列正規化などを知り始めたら分離を検討する。

---

# 17. 初期段階の標準進行手順

```
① 目的を日本語1文にする
↓
② データフローを描く
↓
③ MVP境界を決める
↓
④ 欲しい完成データの型を決める
↓
⑤ フォルダ・ファイル名を決める
↓
⑥ 外部サービスとの疎通確認
↓
⑦ 最小1件を読む
↓
⑧ 最小1件を加工
↓
⑨ 最小1件を書く
↓
⑩ テスト合格
↓
⑪ Git commit
↓
⑫ 次の1機能
```

---

# 18. AIへの共通指示

```
- 最初に全体像を示す
- 一気に完成コードを出さない
- 1機能ずつ進める
- 初見の関数・API・CLIオプションは意味を説明する
- 「なぜこの実装か」を説明する
- 型を完成成果物の契約として扱う
- main.ts / popup.ts を司令官にする
- 実働処理は workers へ分ける
- マジックナンバーは config へ集める
- 推測でデータを埋めない
- 外部サービスは疎通確認を先にする
- 読み取り確認後に書き込みを試す
- 自動化は手動操作を理解した後に行う
- 次の未知領域へ入る前にGitでセーブする
- 必要以上の抽象化・汎用化を初手で行わない
```

---

# 19. Codex向け開始プロンプト例

```
このプロジェクトではLG流の開発方針を採用する。

まずコードを書かず、
1. 目的を日本語1文で整理
2. データフロー
3. MVP境界
4. 欲しい完成データの型
5. フォルダ構成
の順で提案すること。

実装は1機能ずつ縦切りで進める。

main.tsは司令官とし、
細かい実装はworkersへ分離する。

typesは「部隊が納品する完成成果物の契約」として設計する。

外部サービスを使う場合は、
本処理より先に接続 → 読み取り → 書き込みの疎通確認を行う。

初見のAPI・関数・CLIコマンドを使う場合、
正式名、目的、引数、処理の流れ、なぜ使うかを短く説明してから使う。

大きなコードを一度に出さず、
各ステップで動作確認してから次へ進む。
```

---

# 20. LG流の判断基準

迷ったらこの順で判断する。

```
動くか？
↓
事実を取得できているか？
↓
責務は分かれているか？
↓
型でGOALが見えるか？
↓
テストできるか？
↓
壊してもGitで戻せるか？
↓
その後に自動化・汎用化
```

---

## 最後に

LG流の目的は「最初から完璧な設計」を作ることではない。

```
全体像を把握
↓
小さく作る
↓
確実に動かす
↓
問題を局所化
↓
理解してから自動化
↓
必要になった時だけ強くする
```

> **Laziness / Impatience / Hubris**
> 
> 
> 手作業を減らし、早く動かし、保守できる形にする。
>