# Roblox開発者向け最新情報 完全ガイド（2024年12月〜2026年3月）

Robloxプラットフォームは2024年12月以降、Studio UIの全面刷新、Unified Lightingやテクスチャストリーミングなどのグラフィックス革新、AIアシスタントのエージェント化とMCPサーバー統合、Momentsによるユーザー生成コンテンツの発見エコシステム構築、IPライセンスプラットフォームのセルフサーブ化、そして法定通貨決済やRewarded Video Adsの本格展開といったマネタイズ拡張まで、開発者体験を根本的に変える大規模アップデートを連続的にリリースした。本レポートでは、これら6つのテーマについて最新の技術的詳細と実装方法を網羅的に解説する。

---

## テーマ1：Roblox Studio UIの変更一覧

### Next Gen Studio UIが2026年1月に完全移行

Roblox Studioのリボンツールバーは、レガシーのQtベースUIから完全に新しいシステムへ再構築された。**2025年3月21日**に新UIがデフォルト化（オプトアウト可能）、**2025年11月20日**にフルロールアウト、そして**2026年1月5日**に旧UIが完全廃止された。以降、オプトアウトは不可能となっている。

新UIの主要な変更点は以下の通りである。トップレベルメニュー（File、Edit、Window等）が常時表示となり、以前はタブに隠されていた機能が1〜2クリックでアクセス可能になった。プレイテスト制御（Solo、Multiplayer、Team Test）はウィンドウ上部左側に常設化。Viewportメニューとしてビジュアルデバッグ・解析ツール用のドロップダウンが新設された。

カスタマイズ機能が大幅に拡張され、ユーザーはカスタムタブの作成・複製・名前変更・並び替え・非表示・削除が可能になった。プラグインとネイティブツールを同じタブに混在させることもできる。「Add Tools」ダイアログで全利用可能ツールを検索して追加でき、上級者向けにJSON形式でのタブ設定ファイルも対応する。Manage Tabsウィンドウでは左揃え・中央揃えの切り替えも可能だ。密度オプションとして、**Compact toolbar**トグル、**Show labels**トグル（テキストラベル非表示で最大限コンパクト化）、**Collapse toolbar**（自動非表示、ホバーまたはダブルクリックで表示）が提供される。公式の旧UIから新UIへの機能マッピングガイドが `create.roblox.com/docs/en-us/studio/ui-overview#next-gen-toolbar-mapping` に公開されている。

### Explorer・Propertiesパネルの刷新

Next Gen Explorerは**2025年6月23日**に全ユーザーへ強制ロールアウトされ、旧Explorerは使用不可となった。C++/QtベースからLuauで完全に再構築され、**数十万〜数百万のインスタンスを高速に処理**できるようになった。カスタムアイコンセットのサポート、マルチセレクトの改善、Team Createプレゼンスの復活、ボックスセレクトの改善、複製時のオートネーミング（自動番号付与）、コンテキストメニューのサブカテゴリ階層化が実装された。一方、行間スペースの増加による情報密度の低下はコミュニティから批判があり、Robloxは将来的にStudio全体の密度設定を提供すると回答している。

**Propertiesパネル**については、2025年11月時点でRobloxスタッフが「初期段階にある」と確認しており、Explorer・リボンと同様のプレビュー/ベータリリースシリーズが予定されているが、この期間内に大きなUI変更は出荷されていない。

### Script Editorの改善

**Luau New Type Solver**が**2025年11月**にGeneral Releaseとなり、Studio Betaから卒業した。`nocheck`および`non-strict`モードの全ユーザーに展開され、型推論と型チェック精度が向上。Studio SettingsにScripting workspaceプロパティが追加され、New Type Solverの有効/無効やデフォルトの型チェックモードを設定できるようになった。

**Find/Replace All Refresh**が**2025年10月**にFull Releaseとなり、大規模コードベースでのFind All・Replace All操作のパフォーマンスが最適化された。**Plugin RunContext**が**2025年2月**に導入され、プラグインスクリプトの動的有効化/無効化、Parallel Luauの使用、プラグイン用オートコンプリートが可能になった。Studio Luau File Sync（外部エディタでのフォルダ同期機能）は当初2025年中頃を目標としていたが、2026年初頭に延期されている。

### 新たに追加されたツール・パネル

**Comments and Annotations**（2025年5月〜6月）では、3Dビュー内のオブジェクトにコメントをピン留めし、Team Createコラボレーターとディスカッションできるようになった。2025年11月にはメールダイジェスト通知も追加。

**User Provided Default Instances**が**2026年1月15日**にFull Releaseとなり、「Insert Object」で挿入するオブジェクトのデフォルトプロパティ値をカスタマイズできるようになった（例：Partのデフォルトサイズ・色・Anchored状態など）。

**Redesigned Place Version History**が**2026年2月27日**に発表され、バージョンノート機能、高度なフィルタリング（日付範囲、保存タイプ、コラボレーター別）、ドッキング可能ウィジェット、`Ctrl+Alt+S`でのノート付き保存ショートカットが実装された。

### Asset Managerの全面刷新

**Revamped Asset Manager**が**2025年4月17日**にベータ開始。レガシーのAsset ManagerとToolbox（Inventory/Creationsタブ）を統一し、個人・全グループインベントリの横断検索、アセットタイプ・ソース・クリエイター別フィルタ、セマンティック検索、マルチセレクト・一括操作、グリッド/リストビュー切り替えが実現した。

**Universal Importer**が**2026年1月30日**にベータ開始し、画像・オーディオ・動画・3Dファイルを一括インポート可能になった。Robuxコストとアップロード制限が事前表示され、ファイルごとにCreatorインベントリ（個人/グループ）を選択可能。**glTF Export**ベータ（2025年8〜9月）と**Reimport**ベータ（2025年11月）も追加され、非破壊的な3Dコンテンツの再インポートが実現した。

### MicroProfilerとOutputの機能拡張

**MicroProfiler**に**X-Rayモード**（メモリ割り当ての可視化）、**Flame Graphs**（階層的CPU/メモリプロファイリング）、**ダンプ比較（Diffs）**が追加された。**2025年8月**にはNetwork Profilingプラグインが発表され、ネットワークトラフィックグラフ、Verbosityメニュー、個別ネットワークイベントの詳細分析が可能になった。

### Dark/Lightテーマの変更

新UIに伴い、DarkテーマとLightテーマの両方でRobloxのグローバルデザインシステムに沿った新しいカラーパレットが適用された。**Darkテーマは以前より著しく暗くなり**、コミュニティからは「ソフトなダークテーマ」のオプションを求める声が上がっている。Robloxは、カラートークンが全UIコンポーネントに一貫して適用された後、将来的にスタイル/カラーの直接オーバーライド機能を提供する計画を確認している。

---

## テーマ2：グラフィックス・パフォーマンス向上

### Unified Lightingの全面展開

**2025年1月21日**にStudio Betaとして導入、**2025年7月23日**に全エクスペリエンスでライブとなったUnified Lightingは、旧`Lighting.Technology`プロパティ（`Future`/`ShadowMap`/`Voxel`/`Compatibility`）を2つの新プロパティに置き換えた。

**`Lighting.LightingStyle`** はビジュアルスタイルの指定で、`Realistic`（高忠実度のライティング・詳細なシャドウ）と`Soft`（フラットなライティング・拡散シャドウ・クラシックRobloxルック）の2値。**`Lighting.PrioritizeLightingQuality`** はライティング品質の優先度で、`Enabled`（描画距離を犠牲にしてもライティング品質を維持）と`Disabled`（ライティング品質を先に下げる）の2値。どちらもスクリプトから変更不可（旧`Technology`と同仕様）である。

旧テクノロジーからのマッピングは自動的に行われる。**Future → Realistic + Enabled**、**ShadowMap → Soft + Enabled**、**Voxel → Soft + Disabled** となる。中距離オブジェクトのライティングが特に改善され、同じ知覚品質でパフォーマンスが向上するケースもある。

### SLIMによる遠景モデルの品質向上

**Scalable Lightweight Interactive Models（SLIM）** は**2025年10月30日**にPC/Mac向けClient Beta、**2025年12月9日**に全プラットフォームへ拡大した。クラウド上でオンデマンドに複数の最適化済みLoD（Level of Detail）を自動生成し、Instance Streamingでストリームアウトされたモデルを高品質な軽量バージョンで表示する仕組みだ。

設定方法は、Team Createを有効化し、`Workspace.StreamingEnabled = true`に設定、対象モデルの`Model.LevelOfDetail`プロパティを`SLIM`に変更する。旧StreamingMeshからの変換はスクリプトで一括処理可能。クラウド生成アセットはPlaceファイルに保存されないため、**ファイルサイズの削減**と**ロード時間の改善**が得られる。現時点の制約として、スキンメッシュ・アニメーション・アバターは未対応（開発中）、Instance Streamingが必須、`Humanoid`インスタンスは無視される。

### Occlusion Cullingの自動適用

**2024年12月10日**にWindows PCでライブ、**2025年1月27日**に全プラットフォーム（Android含む）で展開。他のオブジェクトに隠されたオブジェクトのレンダリングを省略する機能で、**開発者側の操作は一切不要** — 全エクスペリエンスで自動的に動作する。「The Haunt」での検証では、**低スペックAndroid端末でフレームタイムが最大33%改善**した。2025年6月23日のアップデートでTerrainもオクルージョン対応となった。インテリアや都市景観で最も効果が大きく、オープンアリーナでは効果が限定的。CSG/PartOperationパーツはオクルードされるがオクルーダーにはなれない点に注意。

### Texture Streamingと4Kテクスチャ

**Texture Streaming**は**2025年12月12日**に発表され、距離とカメラビュー（スクリーンスペース重要度）に基づいてテクスチャを動的にロードする。クラウドトランスコーディングにより個別のMippacks単位でリクエスト可能。Modern Cityテンプレートのベンチマークでは、初期ロード時間が**20.6秒→3.0秒**に、テクスチャメモリが**280MB→155MB**に、ダウンロードサイズが**236MB→110MB**に削減された。**開発者側の設定は不要** — 自動で動作する。

**4K Texture Rendering**は**2025年12月12日**にStudio Beta、**2026年1月30日**にパブリッシュ済みエクスペリエンスでライブ。テクスチャを最大**4096×4096px**でレンダリング可能（従来は1024×1024制限）。過去にアップロードされた高解像度アセットも自動的にトランスコードされ4Kストリーミングが有効になる。Robloxはオリジナル画像を最大8K解像度で保持しており、将来的にさらに高解像度対応の可能性がある。Studio BetaでFile → Beta Features → 「4k Texture Rendering」を有効化する。

### 光源レンジの120スタッド拡張

**2025年9月23日**に全ローカルライト（`PointLight`、`SpotLight`、`SurfaceLight`）の最大レンジが**60スタッドから120スタッドに倍増**した。120レンジのライト1つで従来の60レンジのライト約4つ分の領域をカバーでき、総計算量が減少するためパフォーマンス面でも有利。**破壊的変更**として、スクリプトでRangeを61〜120に設定していた場合、従来は60にクランプされていたが、新しい値がそのまま適用されるため、`.Range`をコード内で監査する必要がある。

### Emissive Masks

**2025年10月30日**にStudio Beta、**2026年2月12日**にライブリリース。`SurfaceAppearance`、`MaterialVariant`、`TerrainDetail`にグレースケールテクスチャを使用してピクセル単位のエミッシブ（発光）を制御できるようになった。例えば、光るクリスタルやスクリーン、ライトパネルなどの効果を、個別のNeonパーツなしで実現可能。

### Avatar描画の改善

**Avatar Joint Upgrade**が2026年2〜3月にライブリリースされ、旧Motor6Dベースのアニメーションシステムが物理シミュレーションベースの関節に置き換えられた。アニメーション駆動のパーツが環境と物理的にインタラクト可能になり、自然な手足の揺れやラグドール物理が実現。**Avatar Texture Resolution**は**2026年2月12日**に最大**2048×2048（2K）**に引き上げられ、アバターヘッド・ボディ・レイヤードクロージング・リジッドアクセサリのalbedo、metal、roughness、bumpマップが2Kで利用可能。低スペックモバイル（RAM 3.5GB未満）は従来通り最大1Kのまま。

---

## テーマ3：Roblox AI Assistantでできること

### コード生成・補完・デバッグの進化

**Code Assist**（インラインコード補完）は2024年12月時点で既に正式リリース済みで、累計**3億文字以上**のAI提案コードが採用されていた。Script Editor内で一時停止時に自動表示され、`Alt+Backslash`で手動トリガー、`Tab`で受諾する。

**Assistant**（チャットベース）は**2024年12月5日**にベータを卒業し正式リリース。スクリプトの反復修正、複数スクリプトタイプ（LocalScript、ServerScript、ModuleScript、RemoteEvent）の一括挿入、DataModel全体の階層・名前・型の理解に基づくターゲット修正、コード説明が可能。

**2025年9月5日（RDC 2025）** のAgentic Assistantアップデートで**Multi-Step Actions**が導入され、単一プロンプトから複雑なリクエストを小タスクに分解して順次実行できるようになった。具体例として、「capture the flagゲームの出発点を構築して」→アセット挿入→スクリプト追加→UI構築を自動で実行する。DataModelの動的検索（複数パスでの検索）、プロジェクト全体の解析によるロジックエラー検出、パフォーマンス最適化提案、リファクタリングも可能。**2026年3月5日**にはScript Approval Flowが改善され、セッション単位またはプロンプト単位で全スクリプト編集を自動承諾するオプションが追加された。

### Mesh Generation（Roblox Cube 3D）

**2025年3月17日（GDC 2025）** に発表・オープンソース化された**Cube 3D**は、**18億パラメータ**の3D基盤モデルで、Robloxプラットフォーム上の**150万のネイティブ3Dアセット**で学習されている。Shape Tokenizer（3D形状の離散トークン化）+ Autoregressive Transformer（ShapeGPT）のアーキテクチャを使用し、テキストから3Dオブジェクトを生成する。

Studio上では`/generate`コマンドまたは会話形式で利用でき、`GenerationService`の`GenerateModelAsync` APIを介してエクスペリエンス内でもLuaから呼び出せる。ローンチ以降、**100万以上のモデル**が生成された。

**2026年3月19日**のアップデートで、**バッチ生成**（複数メッシュの同時生成）、**バウンディングボックス**（Partを選択してサイズ・位置を制約）、**最大三角形数制御**（デフォルト10,000、低ポリには100〜1,000推奨）、**再利用性**（単一生成アセットを複数箇所に即座適用）、マルチタスキング（生成中に他の作業が可能）が追加された。MCPツールとしては`generate_mesh`で外部AIクライアントからもアクセス可能。

### Texture Generation

Texture Generatorはベータとして継続運用中。MeshPartまたはModelを選択し、自然言語プロンプトで**1024×1024テクスチャ**を生成する。Generation Angle設定、Front View指定、Seed制御、Smart UV Unwrapが利用可能。制限として、MeshPartのみ対応（通常のPartやCSGは不可）、ColorMapのみ出力（PBRマップ未対応）、1日あたり**5フルテクスチャ・25プレビュー**まで。2026年3月にはMCPツール`generate_material`でカスタムマテリアルバリアントのテキスト生成も可能になった。

### Studio MCP Server — 外部LLM接続

3段階で進化した。**Phase 1（2025年5月）**：オープンソースのStudio MCP Server（Rust製、github.com/Roblox/studio-rust-mcp-server）がリリース。`run_code`（Luauコード実行）と`insert_model`（Creator Storeモデル挿入）が利用可能で、Claude Desktop、Cursorに対応。

**Phase 2（2026年2月25日）**：`get_console_output`、`start_stop_play`、`run_script_in_play_mode`、`get_studio_mode`が追加。

**Phase 3（2026年3月5日）**：**MCP ServerがStudioにネイティブ内蔵**され、追加セットアップ不要に。Assistantの全ツールがMCPサーバー経由で自動的に利用可能。複数Studioインスタンス対応（`list_roblox_studios`、`set_active_studio`）。**Claude Code、Claude Desktop、Visual Studio Code、Cursor、Antigravity**に対応。**Phase 4（2026年3月19日）** では`insert_from_creator_store`、`generate_mesh`、`generate_material`、`screen_capture`が追加。今後、Figma、Blockade Labs、Blenderとの3rd-party MCP接続も予定されている。

### Playtest Automation（仮想入力シミュレーション）

**2026年3月5日**に発表。Assistantおよび MCP Server経由で、プレイテストセッションのプログラム的な開始/停止とプレイヤー入力のシミュレーションが可能になった。`user_mouse_input`（マウスクリック・移動のシミュレート）、`user_keyboard_input`（キーボード入力のシミュレート）、`character_navigation`（パスファインディングによるキャラクター直接移動 — 入力システムをバイパス）が提供される。エンドツーエンドUIテスト、ゲームプレイ検証、自動回帰チェックに活用できる。

### Screenshot Tool

**2026年3月19日**に導入された`screen_capture`ツール。プレイモード中のStudio Viewportをキャプチャし、画像データを返す。MCP Server経由およびBYOK設定のAssistantで利用可能。AIエージェントが視覚的に変更を確認し、次のステップを判断するために使用される。

### BYOK（Bring Your Own Key）

**2026年2月25日**に発表。外部LLMのAPIキーを自分で設定してAssistantの生成能力を強化できる。対応プロバイダは**Anthropic（Claude）**、**OpenAI（GPT）**、**Google Gemini**の3つ。設定はAssistant右上の「…」→「Manage API Keys」→プロバイダ選択→APIキー貼り付け→有効化→モデル選択。APIキーはユーザーのデバイスにローカル保存され、Robloxサーバーにはアップロードされない。Ollama、LM Studio、OpenRouterなどのリクエストはコミュニティから寄せられているが、現時点では未対応。

### Text-to-Speech / Speech-to-Text API

**Text-to-Speech API**は2025年6月ベータ、2025年後半にFull Release。**2026年2月**のアップデートで新しい英語ホストボイス（計11種）と**4言語（フランス語、ドイツ語、イタリア語、スペイン語）**が追加された。NPCの対話、ナレーション、チュートリアル、ゲーム内アナウンスに使用可能。

**Speech-to-Text API**は2025年後半ベータ、**2026年1〜2月にFull Release**。ボイスチャット経由のプレイヤー音声をテキストに変換し、ゲームスクリプトから利用可能。Extended Services購入による追加使用量にも対応。

**Text Generation API**（ベータ、2025年3月〜）はエクスペリエンス内でオープンソースLLMをランタイムで使用し、コンテキスト対応のスマートNPCを構築できる。

### OpenGameEval

**2025年12月17日**に発表されたオープンソースの評価フレームワークおよびベンチマークデータセット。サンドボックス環境でRoblox Studioのエディットタイム・プレイタイム動作をシミュレートし、入力シミュレーション（ボタンクリック、キーボード、カメラ操作）を組み込む。**47の手動キュレーションされたテストケース**（初期リリース）で、ゲームメカニクス、環境構築、キャラクターアニメーション、UI設計、サウンドデザインをカバー。**pass@k、cons@k、all@k**の業界標準メトリクスを使用。2026年3月19日に**30の新しいデバッグ専用評価**（15のベースシナリオ × 1〜3のバグバリアント）が追加された。GitHubリポジトリ（github.com/Roblox/open-eval）で公開中。

---

## テーマ4：Roblox Momentsの具体的な活用例

### Momentsの仕組みと技術的詳細

**2025年9月5日（RDC 2025）** に発表されたRoblox Momentsは、Robloxプラットフォーム内に構築されたTikTokスタイルの短尺動画作成・共有・発見機能である。そのもの自体がRobloxエクスペリエンスとして存在し（`roblox.com/games/119524072047648/Roblox-Moments`）、**米国の13歳以上ユーザー**を対象にベータ提供中。

ワークフローは3ステップ。第1に**Capture** — ゲームプレイ中にRoblox内蔵キャプチャツールで最大**30秒の動画クリップ**を録画。第2に**Create & Share** — Momentsエクスペリエンスを開き、「+」ボタンからギャラリーにアクセス、動画をトリミングし、**DistroKidとの提携による音楽追加**、キャプション記述、投稿（1日最大**10動画**）。第3に**Discover** — スクロール可能なフィード形式でユーザー生成コンテンツを閲覧、リアクション、「Join」ボタンで即座にそのエクスペリエンスにテレポート。

安全機能として、動画キャプチャからエクスペリエンス内UIとユーザーネームが**自動的に削除**され、ボイス通信は録音されない。公開前に自動モデレーションが適用される。統計として、2025年7〜8月の1ヶ月間で**9.3億以上のスクリーンショット**がキャプチャされ、2025年7月の動画キャプチャ開始以降**2.4億以上の動画**がキャプチャされた。

### プレイヤー獲得・マーケティング観点での活用

Momentsの最大の強みは**ワンタップ「Join」ボタン**による発見からプレイまでのゼロフリクション体験である。Robloxの推薦技術と同じアルゴリズムでコンテンツが推薦され、プラットフォーム外（YouTube、TikTok）へのエンゲージメント流出を防ぐ。Morgan Stanleyのアナリストは「Momentsのような機能がバイラルヒットの連鎖を生むフライホイール効果を持つ」と評価。eMarketerは「プレイヤーをクリエイターに変え、新しい広告在庫を生む」と分析している。現時点ではMomentsフィード内に直接広告は配信されておらず、エンゲージメントとディスカバラビリティの向上に焦点を置いている。

### ゲームデザイン観点でのベストプラクティス

Momentsの効果を最大化するために、以下のようなゲーム内イベントでキャプチャをトリガーするのが効果的だ。**ピーク達成瞬間**（Obbyの難関クリア、ハイスコア達成）、**劇的な勝利**（試合決定ゴール、パーフェクトスピードラン）、**予想外の物理インタラクション**（エマージェントな面白い瞬間）、**クリエイティブ表現**（ファッションショー、アバターカスタマイズ）、**レアイベント**（ボス撃破、レアアイテム発見）。重要なのは、**Captures APIを使ってピーク瞬間で自動キャプチャをトリガー**し、プレイヤーが録画を忘れることを防ぐことだ。Upload APIで即座に共有を促し、Recommendations APIでエクスペリエンス内ハイライトリールを構築することが推奨される。

### 開発者向けAPI群

**CaptureService**が基盤サービスで、`StartVideoCaptureAsync`、`StopVideoCapture`、`CaptureScreenshot`、`PromptSaveCapturesToGallery`、`PromptShareCapture`などのメソッドを提供。**Upload API**（ベータ、2025年11月12日）で ユーザーがエクスペリエンス内から直接キャプチャを公開可能。**RecommendationService**（ベータ、2025年11月12日）でアイテム登録（`RegisterItemAsync`）、パーソナライズ推薦生成（`GenerateItemListAsync`）、インプレッション/アクションイベントログを処理。**Share Link API**（2025年10月2日）で`SocialService:PromptLinkSharing`によるカスタムディープリンクを作成。Momentsエクスペリエンスのソースコード（.rbxlファイル）も公開されている。

開発者はMaturity & Compliance Questionnaireの更新が必要で、「Media Sharing」（Upload API使用時）、「Continuous Load and Autoplay」（自動再生フィード使用時）、「Cross-Experience Content」（他エクスペリエンスからのアップロード許可時、13+年齢制限トリガー）の回答を行う。

### ソーシャル機能との連携とリーチ

Share Link APIはRobloxのソーシャルグラフと連携し、ConnectionsやDiscord等へのリンク共有が可能。Communitiesは2025年を通じてForums、Announcements、Eventsタブに進化しており、Momentsとの直接的な統合は明文化されていないが、エコシステム全体として相互補完的に機能する。Momentsはプラットフォーム上でSearchタブ、Moreタブ、将来的にはHomeページで表示され、開発者がRecommendations APIでエクスペリエンス内サーフェス（ジャンボトロン、ビルボード、ロビーフィード等）に組み込むことも可能。

---

## テーマ5：ライセンスカタログ拡張

### 利用可能なIPの現状

Robloxは**2025年7月15日**にLicense Managerと Licensesカタログを正式ローンチし、**2025年11月11日**にセルフサーブ化を達成した。以下のIPが確認されている。

| パートナー | 提供IP | 特記事項 |
|---|---|---|
| **Netflix** | Squid Game、Stranger Things | DAU要件なし。IP保有者が収益の約85%を取得（クリエイターは約15%） |
| **Lionsgate** | Twilight、Saw、Divergent、Now You See Me、The Strangers (Ch.1&2)、Blair Witch、Fall | 2025年10月にホラーIPを追加 |
| **Sega (RGG Studio)** | Like A Dragon（龍が如くシリーズ） | 収益の50%がSega、最低1,000 DAU必須 |
| **Kodansha（講談社）** | Blue Lock（ブルーロック）、転生したらスライムだった件 | Blue Lock: Rivalsは40億以上の訪問を達成 |
| **Mattel** | Monster High、Polly Pocket、Street Sharks、UNO（2026年2月ローンチ） | Matchbox、Rock 'Em Sock 'Em Robots、Barbie、Hot Wheels、Masters of the Universeが今後予定 |
| **Invisible Narratives** | Skibidi Toilet | RDC 2025で発表、近日公開 |

### 開発者がIPをゲームに組み込む手順

`create.roblox.com/explore/licenses`からカタログを閲覧し、IPの詳細ページ（適格要件、コンテンツ基準、レベニューシェア率、最大コンテンツ成熟度レベル）を確認する。「Apply for License」をクリックし、対象エクスペリエンスを選択（ベースプレートでも可、DAU要件がないIPの場合）。最大1,000文字のピッチ（クリエイティブ概要、IP使用計画、実装タイムライン、開発者実績）を提出。コンテンツ基準の確認・同意後、エクスペリエンスの準備状況を選択し、申請を送信する。IP保有者がレビュー・承認/拒否し、結果はCreator Hub、メール、Roblox Inboxで通知される。

**重要な制約**として、現在は**Full Experience License**のみ — IPがエクスペリエンス全体の中心テーマでなければならず、部分的使用（1レベルだけIP使用等）は不可。ライセンスはクリエイター側から**キャンセル不可**。部分使用ライセンス、期間限定イベントライセンス、アバターアイテムライセンスはロードマップ上にあるが未提供。

### Approved Merchandiser Program（AMP）との関係

**2025年5月15日**にCommerce API/Shopify連携と共に発表されたAMPは、物理商品の購入をRoblox上のアバターアイテムとリンクさせるプログラム。AMPバッジ（「Official Digital Roblox Item Included」）が付いた物理商品には、Robloxで引き換え可能なユニークコードが付属する。License Managerとは独立しているが補完的で、IP保有者は両プログラムに同時参加可能。パートナーにはParamount、Deddy Bears（Innov8 Creative Academy）、Fenty Beauty、The Weekndなどがいる。

### 費用・収益シェア

**初期費用はなし** — 完全にレベニューシェアモデル。IP保有者がレートを設定し、通常は**10〜25%**（Roblox公式ガイダンス）。ただし、Sega（50%）やNetflix（約85%）のように大幅に異なるケースもある。100 Robuxのアイテム販売の場合、30 RobuxがRobloxプラットフォーム手数料、10 Robuxがアフィリエイト手数料、残り60 Robuxがクリエイターとip保有者間でシェアされる（例：10%シェアならIP保有者6 Robux、クリエイター54 Robux）。マーケットプレイスで購入されたアイテムはIPライセンスのレベニューシェア対象外。

---

## テーマ6：マネタイズ方法一覧

### 従来手法の現在

**Game Passes**と**Developer Products**はいずれもRobux売上の**70%**が開発者に還元される（Robloxが30%のマーケットプレイス手数料を徴収）。2025年4月からRegional Pricingが導入開始され、**2026年3月30日**にGame Passのリージョナルプライシングが**全パスでデフォルト有効**となった。参加エクスペリエンスでは課金ユーザーが**26%増加**した実績がある。

**Creator Rewards**が**2025年7月24日**に旧Premium Payoutsを置き換えた。2つのコンポーネントから構成される。**Daily Engagement Reward**は、過去60日間で$9.99以上をRobloxで使った「Active Spender」が開発者のエクスペリエンスで10分以上プレイし、かつその日の**最初の3エクスペリエンス**に含まれる場合、**5 Robux**が付与される仕組み（60日間のホールド期間後にクレジット）。**Audience Expansion Rewards**は、新規ユーザーまたは60日以上非アクティブだった復帰ユーザーの最初の60日間のQualifying Purchases（プラットフォーム全体）の**35%**がレベニューシェアとして付与される。ID認証済みアカウントとDevExアカウントが必要。

**Subscriptions**はローカル通貨ベースの月額自動更新サブスクリプション。**2024年5月のアップデート**以降、リニューアル時にRobloxのプラットフォーム手数料が免除され、継続課金の収益が大幅に向上している。

### 法定通貨Paid Access

**2025年1月31日**にローンチ。Robuxを介さず法定通貨で一回の入場料を課金できる。

| 価格帯 | 開発者レベニューシェア |
|---|---|
| $9.99 | **50%**（約$4.99） |
| $29.99 | **60%**（約$17.99） |
| $49.99 | **70%**（約$34.99） |

購入はデスクトップ・Webのみ対応だが、購入後は全プラットフォームでプレイ可能。48時間以内の返金ポリシーあり。13歳以上のID認証済み、Tipaltiアカウント設定済みが条件。Creator Hub → Access Settings → Payment で設定する。

### Rewarded Video Ads

**2026年2月18日**に全対象クリエイターに拡大。13歳以上のユーザーが自発的に視聴する6〜30秒の全画面動画広告で、視聴完了と引き換えにゲーム内報酬を提供する。収益モデルは**eCPM**（1,000インプレッション当たりの有効コスト）ベースで、完了率**90%以上**、ビューアビリティ**95%以上**を記録。適格条件は月間ユニーク訪問者**2,000以上**の公開エクスペリエンス、クリエイターが**13歳以上**（従来の18歳以上から引き下げ）、**2FA有効**、**ID認証済み**。Game Settings → Monetization → Enable Rewarded Video Adsで有効化する。

### Homepage Feature Ads

**CES 2026（2026年1月）** で発表。Robloxホームページ上のプレミアム**CPMベース**広告ユニットで、1.51億以上のDAUの起点に表示される。現在は**クローズドベータ**で、主に**ブランド・大手広告主**向け（Sam's Club、Universal Pictures、e.l.f. Beauty等）。開発者もイベント/アップデートのプロモーションに使用できる可能性が示唆されているが、主要ユースケースはブランド広告。

### ブランドインテグレーション収益シェア（2027年〜）

**2027年1月**からRobloxがゲーム内ブランドインテグレーション（従来はクリエイターとブランド間で直接交渉、クリエイターが100%取得）からレベニューシェアを徴収開始。2026年4月15日にベータ登録・ラベリングツール開始、2026年5月4日に全ブランド契約の登録義務化、2026年8月にレポートツールベータ、2027年1月にレベニューシェア発動。**正確なシェア率は2026年3月時点で未公表**で、Q2 2026に公開予定。スポンサーコンテンツの開示義務化とラベリングツールがStudioに組み込まれる。

### Shopify連携・Commerce API

**2025年5月15日**にクローズドベータを卒業。Shopifyストアを接続し、Robloxエクスペリエンス内で**物理商品を直接販売**できる。「Buy Now」プロンプト → 商品ページ閲覧 → オプション選択 → Shopify Checkout で完結。**13歳以上のユーザー**のみ購入可能。早期導入者のTwin Atlasは数週間で**6桁のコマース収益**を達成、注文の90%がゲーム内コマース経由。AMPと組み合わせて物理商品+デジタルアイテムのバンドル販売も可能。

### DevExレート

**2025年9月5日**に**$0.0038 USD/Robux**に引き上げ（従来$0.0035から**8.6%増**）。2025年9月5日以前に獲得したRobuxには旧レートが適用。最低DevEx額は**30,000 earned Robux**（=$114 USD）。月1回の申請が可能。Tipalti経由で銀行振込またはPayPalで支払われ、140以上の通貨に対応。2024年のクリエイター総収益は**$9.23億**、2025年Q1だけで**$2.816億**（YoY 39%増）。

### チーム・大規模開発向け

**Group Payouts**ではグループ所有エクスペリエンスからの収益がGroup Fundに蓄積され、オーナーまたは権限を持つメンバーがWeb管理UIから手動で分配できる。一回限りの支払いと定期的（パーセンテージベース）の支払いの2タイプがある。Open Cloud API経由の自動化は現時点で未対応だが、コミュニティからの要望は活発。グループ所有エクスペリエンスもCreator Rewards（2025年7月〜）の対象で、収益権限を持つコミュニティメンバーがID認証済み＋DevExアカウントを保持している必要がある。

**Sponsored Experiences**はAds Manager（`create.roblox.com/ads-manager`）経由のセルフサーブ広告で、ホームページ上の優先枠にエクスペリエンスが表示される。Ad Credits（285 Robux = 1 Ad Credit、最低10クレジット）で資金化し、オークションベースのCPM入札。2025年には**45,000以上のエクスペリエンス**がAds Managerを使用（YoY 70%増）。ID認証と2FA必須。

**Open Cloud API**はデータストアアクセス、メッセージング、ユーザーインベントリ、グループ読み取りなどを提供するが、外部決済プロセッサとの直接統合メカニズムは存在しない。全金銭取引はRobloxネイティブシステム（Robux、法定通貨Paid Access、Shopify Commerce API）を経由する必要がある。Shopify/Commerce APIが現時点で外部決済統合に最も近い仕組みである。

---

## 結論：2024年12月〜2026年3月の変革の本質

この約15ヶ月間のRobloxプラットフォームの変化は、3つの明確なトレンドに集約される。第1に**AIファースト開発の本格化** — Cube 3Dによるメッシュ生成、MCPサーバーのStudio内蔵化、Playtest Automationにより、開発ワークフロー全体にAIが組み込まれた。BYOKにより外部LLMの選択肢も広がり、2026年後半にはFigmaやBlenderとのMCP接続も予定される。

第2に**プラットフォーム経済の成熟化**。法定通貨Paid Access、Regional Pricing、Rewarded Video Ads、Shopify連携、そして2027年のブランドインテグレーション収益シェアポリシーは、Robloxが純粋なゲームプラットフォームからメディア・コマースプラットフォームへ進化していることを示す。DevExレートの引き上げとCreator Rewardsの導入は、クリエイターの収益機会を「Premiumサブスクライバーの滞在時間」から「Active Spenderの初回エンゲージメント + 新規ユーザー獲得」へとシフトさせた。

第3に**技術基盤の世代交代**。Unified Lighting、SLIM、Texture Streaming + 4Kテクスチャ、Occlusion Culling、Emissive Masksはいずれもデバイスに応じた動的品質調整を前提に設計されており、「全デバイスで見た目が良い」から「各デバイスで最適な品質を自動選択する」パラダイムへの転換が進んでいる。Studio UIもQt/C++ベースからLuauベースへの全面刷新が完了し、カスタマイズ性と拡張性が飛躍的に向上した。