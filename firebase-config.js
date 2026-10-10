// Firebase設定。Firebaseコンソールの「プロジェクトの設定 → マイアプリ → SDKの設定と構成」の値を貼り付けてください。
// apiKey を空のままにすると、クラウド同期もログインもオフ（ブラウザ内保存のみ）で動きます。
// ※ ここの値は公開されても構いません。データはFirestoreのセキュリティルールで守ります（README参照）。
window.SEKIGAE_FIREBASE = {
  config: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: ""
  },
  requireLogin: true,      // true: Googleログインしないと使えない / false: ログインなしでも使え、任意で同期
  allowedEmails: []        // 例: ["teacher@example.com"]。空なら任意のGoogleアカウントを許可
};
