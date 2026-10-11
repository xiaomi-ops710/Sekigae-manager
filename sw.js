const C='sekigae-v5';
const HOSTS=/^(fonts\.googleapis\.com|fonts\.gstatic\.com|www\.gstatic\.com)$/;
const PRE=['./','index.html','firebase-config.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(PRE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
// キャッシュ優先（stale-while-revalidate）：キャッシュがあれば即座に返し、裏で最新版を取得して次回起動に反映
self.addEventListener('fetch',e=>{
  const rq=e.request; if(rq.method!=='GET')return;
  const u=new URL(rq.url);
  if(u.origin!==location.origin&&!HOSTS.test(u.hostname))return; // Firebase Auth/Firestore通信には触れない
  e.respondWith((async()=>{
    const cache=await caches.open(C);
    const cached=await cache.match(rq,{ignoreSearch:rq.mode==='navigate'})||(rq.mode==='navigate'?await cache.match('index.html'):undefined);
    const net=fetch(rq).then(async r=>{
      if(r&&(r.ok||r.type==='opaque')){
        const old=cached&&cached.headers.get('etag'),nw=r.headers&&r.headers.get('etag');
        await cache.put(rq,r.clone());
        if(rq.mode==='navigate'&&old&&nw&&old!==nw){const cl=await self.clients.matchAll();cl.forEach(c=>c.postMessage('updated'));}
      }
      return r;
    }).catch(()=>cached);
    if(cached){e.waitUntil(net);return cached;}
    return net;
  })());
});
