const C='sekigae-v4';
const HOSTS=/^(fonts\.googleapis\.com|fonts\.gstatic\.com|www\.gstatic\.com)$/;
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','firebase-config.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'])).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin&&!HOSTS.test(u.hostname))return; // Firebase/Auth通信には触れない
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r;}).catch(()=>caches.match(e.request).then(m=>m||caches.match('index.html'))));
});
