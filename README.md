# 席替えスタジオ

名前・座席レイアウト・高度な条件から、条件を満たす席替えを自動生成するWebアプリです。ビルド不要の静的サイト（`index.html` 1枚）で、データはブラウザ内にのみ保存されます。

## GitHub Pages で公開する
1. このフォルダの中身をGitHubリポジトリの `main` ブランチ直下に置いて push します。
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にします（同梱の `.github/workflows/pages.yml` が自動でデプロイします）。
   - Actionsを使わない場合は Source を「Deploy from a branch（main / root）」にしてください。`.nojekyll` が入っているのでそのまま動きます。
3. `https://<ユーザー名>.github.io/<リポジトリ名>/` で開けます。スマホではホーム画面に追加するとアプリとして使え、オフラインでも起動します。

## 主な機能
- 名前・タグ・欠席管理、名簿の一括／CSV読み込み
- 席レイアウトエディタ（通路・班・テンプレート・反転）
- 条件：近くに置く／近づけない／距離／席の範囲／席の固定／同じ・別の行列／班／分散（必須 or できれば＋優先度）
- 学級委員の抽選（タグ別・経験者除外・副委員）と、学級委員を後ろに置く等の条件
- 前回と同じ席・隣を避ける、前列後列の公平化、乱数シード
- 6案の候補比較、シャッフル後のドラッグ／クリック入れ替え、手動配置、ピン留め、元に戻す／やり直し
- PNG画像保存・画像コピー・A4印刷、配置表/CSVコピー、バックアップ、保存スロット

## 注意
- 「AIで条件追加」はClaudeアーティファクト上でのみ表示されます（GitHub Pages版には出ません）。
- フォントとアイコンはGoogle Fontsから読み込みます（オフライン時は2回目以降キャッシュを使用）。

## Googleログイン必須 + Firebase同期（任意）
`firebase-config.js` に設定を入れると、Googleログインが必須になり、名簿・レイアウト・条件・履歴がFirestoreに保存されて複数端末で同期されます。空のままなら従来どおりブラウザ内保存のみです。

1. [Firebaseコンソール](https://console.firebase.google.com/)でプロジェクトを作成し、「ウェブアプリ」を登録して `firebaseConfig` をコピー。
2. **Authentication** → ログイン方法 → **Google** を有効化。
3. Authentication → 設定 → **承認済みドメイン** に `<ユーザー名>.github.io` を追加。
4. **Firestore Database** を作成（ロケーション `asia-northeast1` 推奨）し、**ルール** に下記を貼って公開。
5. `firebase-config.js` に `config` の値を貼り、必要なら `allowedEmails`（許可するメールアドレス）や `requireLogin` を設定して push。

### Firestoreルール（本人だけが自分のデータを読み書き）
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
特定の先生だけに限定する場合は、条件に `&& request.auth.token.email in ['teacher@example.com']` を追加してください。

### 保存の仕組み
- `users/{uid}/classes/{クラスID}` に1クラス=1ドキュメントで保存（名前・設定・履歴をJSON文字列で格納）。
- 変更の1.5秒後に自動保存。他の端末で変更すると、開いている画面にも反映されます（後から保存した方が優先）。
- 右上の雲アイコンから、クラスの追加・複製・改名・削除、手動同期、ログアウトができます。
- ログアウト時、共用PCにデータが残らないよう、この端末のローカル保存も消去します。

### 注意
- 画面のログイン制限はUI上のものです。データそのものを守っているのはFirestoreルールです。アプリのコード自体を非公開にしたい場合は、非公開リポジトリのホスティングやCloudflare Accessなどが必要です。
- 生徒の氏名は個人情報です。学校・自治体の情報取扱いルールを確認のうえ、必要なら氏名を出席番号やイニシャルにして運用してください。
- Firebase Authenticationのリダイレクト方式は、ブラウザのサードパーティCookie制限で失敗することがあります。ホーム画面に追加したアプリで失敗する場合は、ブラウザ版からログインしてください。
