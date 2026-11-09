# 席替えスタジオ

名前・座席レイアウト・高度な条件から、条件を満たす席替えを自動生成するWebアプリです。ビルド不要の静的サイト（`index.html` 1枚）です。Firebaseを設定すると、ログイン・複数端末での同期・オンラインルーム・Geminiによる条件入力が使えます。設定しなければ、データはブラウザ内にだけ保存されます。

## GitHub Pages で公開する
1. このフォルダの中身をGitHubリポジトリの `main` ブランチ直下に置いて push します。
2. リポジトリの **Settings → Pages → Build and deployment → Source** を「Deploy from a branch（main / root）」にします。`.nojekyll` が入っていれば、そのまま動きます。
3. `https://<ユーザー名>.github.io/<リポジトリ名>/` で開けます。スマホやiPadではホーム画面に追加するとアプリとして使え、オフラインでも起動します。

## 主な機能
- 出席番号・名前・タグ・欠席管理、名簿の一括／CSV読み込み、名簿の写真読み取り（AI）
- 席レイアウトエディタ（通路・班・テンプレート・反転）
- 条件：近くに置く／近づけない／距離／席の範囲／席の固定／同じ・別の行列／班／分散（必須 or できれば＋優先度）
- 学級委員の抽選（タグ別・経験者除外・副委員）と、学級委員を後ろに置く等の条件
- 前回と同じ席・隣を避ける、前列後列の公平化、乱数シード（指定すると同じ条件で同じ結果を再現）
- 6案の候補比較、シャッフル後のドラッグ／クリック入れ替え、手動配置、ピン留め、元に戻す／やり直し
- **オンラインルーム**：8けたのコードで参加者と座席表を共有（詳しくは下記）
- PNG画像保存・画像コピー・A4印刷、配置表/CSVコピー、バックアップ、保存スロット

## 文章で条件を追加
「田中は佐藤の隣」「学級委員が木村の後ろ」「青木と伊藤は3マス離す」のような文章を、条件に変換します。
- Firebaseでログインしている場合は **Gemini（Firebase AI Logic）** で変換します。APIキーの入力は不要です。
- それ以外は、端末内の簡易解析で変換します。

## Firebase の設定（ログイン・同期・オンライン・AI）
`firebase-config.js` に設定を入れると、Googleログインが必須になり、名簿・レイアウト・条件・履歴がFirestoreに保存されて複数端末で同期されます。`apiKey` が空のままなら、従来どおりブラウザ内保存だけで動きます。

### 1. プロジェクトと基本設定
1. [Firebaseコンソール](https://console.firebase.google.com/)でプロジェクトを作成し、「ウェブアプリ」を登録して `firebaseConfig` をコピーします。
2. **Authentication** → ログイン方法 → **Google** を有効にします。
3. Authentication → 設定 → **承認済みドメイン** に `<ユーザー名>.github.io` を追加します。
4. **Firestore Database** を作成します（ロケーションは `asia-northeast1` 推奨）。**ルール** に下記を貼って公開します。
5. `firebase-config.js` の `config` を貼り替えて push します。`allowedEmails`（許可するメールアドレス。空なら誰でもGoogleアカウントで利用可）と `requireLogin` も設定できます。

### 2. Firestore セキュリティルール
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 自分の名簿・レイアウト・履歴（本人だけが読み書きできる）
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // オンラインルーム
    match /rooms/{roomId} {
      function isMember() {
        return request.auth != null &&
          exists(/databases/$(database)/documents/rooms/$(roomId)/participants/$(request.auth.uid));
      }
      // コードを知っている人だけがルームを1件ずつ読める（一覧はできない）
      allow get: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.ownerUid == request.auth.uid;
      allow update: if request.auth != null && (
        resource.data.ownerUid == request.auth.uid ||
        (resource.data.editors == 'all' && isMember() &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['board', 'rev', 'by', 'byRole', 'updatedAt']) &&
         request.resource.data.board.size() < 500000)
      );
      allow delete: if request.auth != null && resource.data.ownerUid == request.auth.uid;

      match /participants/{uid} {
        allow read: if isMember();
        allow create, update: if request.auth != null && request.auth.uid == uid;
        allow delete: if request.auth != null && (
          request.auth.uid == uid ||
          get(/databases/$(database)/documents/rooms/$(roomId)).data.ownerUid == request.auth.uid
        );
      }

      match /messages/{messageId} {
        allow read: if isMember();
        allow create: if isMember() && request.resource.data.uid == request.auth.uid &&
          request.resource.data.text is string && request.resource.data.text.size() <= 300;
        allow delete: if get(/databases/$(database)/documents/rooms/$(roomId)).data.ownerUid == request.auth.uid;
      }
    }
  }
}
```
特定の先生だけに限定する場合は、条件に `&& request.auth.token.email in ['teacher@example.com']` を追加してください。ルールは公開前に、Firebaseコンソールの「ルールのシミュレーター」で確認することをおすすめします。

### 3. Gemini（Firebase AI Logic）
1. Firebaseコンソールで **AI Logic** を開き、「開始」を押します。Gemini Developer API を選びます。
2. 2026年7月以降は、AI Logic で **App Check が必須** です。次の「App Check」を設定してください。
3. 使うモデルは `index.html` 内の `AI_MODELS` で変更できます（既定：`gemini-3.8-flash`、予備：`gemini-3.5-flash-lite`）。モデルは世代交代が早いので、Firebase AI Logic の「対応モデル」ページで、廃止予定のないモデル名を確認してください。`gemini-2.5-*` は2026年10月に廃止予定です。

### 4. App Check（AI機能の保護）
1. Firebaseコンソールの **App Check** で、ウェブアプリを登録します。プロバイダは **reCAPTCHA v3**（または reCAPTCHA Enterprise）を選び、サイトキーを取得します。
2. サイトキーを `firebase-config.js` の `appCheckSiteKey` に入れ、必要なら `appCheckType` を `"enterprise"` にします。
3. reCAPTCHA 側の許可ドメインに `<ユーザー名>.github.io` を追加します。
4. `localhost` で試すときは、App Checkのデバッグトークンを使います（Firebaseの公式手順を参照）。

## オンラインルーム
- **主催者**：「オンライン」→「ルームを作成」で、8けたのコードが出ます。席替えの結果が、参加者の画面にリアルタイムで表示されます。チャットもできます。
- **参加者**：「オンライン」→「コードで参加」で、コードを入れます。座席表を見たり、チャットに参加したりできます。
- **席の入れ替え**：主催者が「参加者も席を入れ替えられる」をオンにすると、参加者は席を2つタップして入れ替えを提案できます。提案は主催者の画面に取り込まれ、全員に反映されます。ピン留めの席は動かせません。
- ルームに入ると、ブラウザを閉じても、次にログインしたときに自動で戻ります。主催者が「ルームを閉じる」を押すと、チャットと参加者の情報も消えます。
- **注意**：ルームのコードを知っている人には、座席・**生徒の名前**・チャットの内容が見えます。コードは知らない人に教えないでください。学校の個人情報のルールに従って運用してください。

## 保存の仕組み
- 名簿などは `users/{uid}/classes/{クラスID}` に、1クラス=1ドキュメントで保存されます（名前・設定・履歴をJSON文字列で格納）。
- 変更の1.5秒後に自動保存されます。他の端末で変更すると、開いている画面にも反映されます（後から保存した方が優先）。
- 右上の雲アイコンから、クラスの追加・複製・改名・削除、手動同期、ログアウトができます。
- ログアウト時、共用PCにデータが残らないよう、この端末のローカル保存も消去します。

## 注意
- 画面のログイン制限はUI上のものです。データそのものを守っているのはFirestoreルールです。アプリのコード自体を非公開にしたい場合は、非公開リポジトリのホスティングやCloudflare Accessなどが必要です。
- 生徒の氏名は個人情報です。学校・自治体の情報取扱いルールを確認のうえ、必要なら氏名を出席番号やイニシャルにして運用してください。
- 名簿の写真読み取り・条件の文章変換・画像のデザイン読み取りでは、画像や文章がGoogleのAPI（Gemini）に送信されます。
- フォントとアイコンはGoogle Fontsから読み込みます（オフライン時は2回目以降キャッシュを使用）。
- Firebase Authenticationのリダイレクト方式は、ブラウザのサードパーティCookie制限で失敗することがあります。ホーム画面に追加したアプリで失敗する場合は、ブラウザ版からログインしてください。
