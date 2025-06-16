# プロジェクト開発指針

## プロジェクト概要

このプロジェクトは昇降デスク（Flexispot）の制御を行うElectronアプリケーションのWebプロポーザルです。

## コーディング規約

### JavaScript

- ES6+ の構文を使用してください
- const/let を適切に使い分け、var は使用しないでください
- アロー関数を優先的に使用してください
- async/await を使用し、Promise.then は避けてください
- 関数名、変数名は camelCase を使用してください

### HTML

- セマンティックHTMLを使用してください
- アクセシビリティを考慮してください（alt属性、role属性など）
- インデントは2スペースを使用してください

### CSS

- BEMまたは類似の命名規則を使用してください
- レスポンシブデザインを考慮してください
- CSS Custom Properties (CSS変数) を活用してください

### コメント

- 日本語でのコメントを推奨します
- 複雑なロジックには必ずコメントを付けてください
- TODO、FIXME、NOTE などのマーカーを適切に使用してください

## Electronアプリケーション固有の注意点

- メインプロセスとレンダラープロセスの違いを理解してください
- IPC通信を適切に実装してください
- セキュリティベストプラクティスに従ってください
- Node.js APIの使用時は適切なエラーハンドリングを行ってください

## Service Worker

- オフライン対応を考慮してください
- キャッシュ戦略を適切に実装してください
- 更新処理を適切に実装してください

## デバッグとテスト

- console.log よりも適切なログレベルを使用してください
- エラーハンドリングを必ず実装してください
- テストコードの作成を推奨します

## パフォーマンス

- 不要なDOM操作を避けてください
- イベントリスナーの適切な管理を行ってください
- メモリリークに注意してください

## GitHub Copilot使用時の注意

- 生成されたコードは必ず確認・理解してから使用してください
- プロジェクト固有の要件に合わせて調整してください
- セキュリティ上の問題がないか確認してください

## コミットメッセージ規約

このプロジェクトでは [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) に従ってコミットメッセージを作成してください。

### 基本形式

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### コミットタイプ

- **feat**: 新機能の追加
- **fix**: バグ修正
- **docs**: ドキュメントのみの変更
- **style**: コードの意味に影響を与えない変更（空白、フォーマット、セミコロンの欠落など）
- **refactor**: バグ修正や機能追加ではないコード変更
- **perf**: パフォーマンスを改善するコード変更
- **test**: テストの追加や既存テストの修正
- **chore**: ビルドプロセスやツール、ライブラリなどの変更

### 例

```text
feat(desktop): add height adjustment functionality
fix(ui): resolve button click event not firing
docs(readme): update installation instructions
refactor(height-debug): simplify height calculation logic
chore(deps): update electron to v25.0.0
```

### 日本語での記述も可

```text
feat(デスク制御): 高さ調整機能を追加
fix(UI): ボタンクリックイベントが発火しない問題を修正
docs(説明書): インストール手順を更新
```

### Breaking Changes

破壊的変更がある場合は、フッターに `BREAKING CHANGE:` を追加するか、タイプの後に `!` を付けてください：

```text
feat!: remove deprecated height API
feat(api)!: send an email to the customer when a product is shipped

BREAKING CHANGE: The height API has been removed in favor of the new adjustment API.
```
