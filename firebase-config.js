// Firebase設定。Firebaseコンソールの「プロジェクトの設定 → マイアプリ → SDKの設定と構成」の値を貼り付けてください。
// apiKey を空のままにすると、クラウド同期もログインもオフ（ブラウザ内保存のみ）で動きます
// ※ ここの値は公開されても構いません。データはFirestoreのセキュリティルールで守ります（README参照）。
window.SEKIGAE_FIREBASE = {
  config: {
    apiKey: "AIzaSyDTkPaNLkH9loh2nds757DMbRcY6g4RG3I",
    authDomain: "sekigae-data.firebaseapp.com",
    projectId: "sekigae-data",
    appId: "1:906980824544:web:d7ee6bfa2cb3ce15b1c785"
  },
   requireLogin: true,
   googleClientId: "906980824544-vjl8s4gub637sfinvs7spf6issne07e2.apps.googleusercontent.com",
   allowedEmails: []
};
