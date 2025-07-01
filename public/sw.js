const CACHE_NAME = 'taskflow-v1.0.0'
const urlsToCache = [
  './',
  './static/js/bundle.js',
  './static/css/main.css',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
]

// インストール時のキャッシュ処理
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('キャッシュを開きました')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.log('キャッシュの追加に失敗しました:', error)
      })
  )
})

// フェッチ時のキャッシュ戦略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにある場合はそれを返す
        if (response) {
          return response
        }
        
        // ネットワークからフェッチを試行
        return fetch(event.request).then((response) => {
          // レスポンスが無効な場合
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })

          return response
        }).catch(() => {
          // ネットワークエラーの場合、オフラインページを返す
          if (event.request.destination === 'document') {
            return caches.match('./')
          }
        })
      })
  )
})

// アクティベート時の古いキャッシュ削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除します:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'タスクのリマインダーです',
    icon: './icons/icon-192x192.png',
    badge: './icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'アプリを開く',
        icon: './icons/action-explore.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: './icons/action-close.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('TaskFlow', options)
  )
})

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    )
  }
})