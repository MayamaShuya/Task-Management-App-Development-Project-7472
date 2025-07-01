// PWA関連のユーティリティ関数

export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true
}

export const canInstallPWA = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully:', registration.scope)
      return registration
    } catch (error) {
      console.log('Service Worker registration failed:', error)
      return null
    }
  }
}

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

export const showInstallPrompt = (deferredPrompt) => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    return deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('ユーザーがPWAインストールを承諾しました')
        return true
      } else {
        console.log('ユーザーがPWAインストールを拒否しました')
        return false
      }
    })
  }
  return Promise.resolve(false)
}

export const createDesktopShortcut = () => {
  // デスクトップショートカット作成の指示を表示
  const instructions = {
    chrome: 'Chrome: メニュー → その他のツール → ショートカットを作成',
    edge: 'Edge: メニュー → アプリ → このサイトをアプリとしてインストール',
    firefox: 'Firefox: アドレスバーの右側のインストールアイコンをクリック',
    safari: 'Safari: 共有ボタン → ホーム画面に追加'
  }
  
  return instructions
}

// アプリのアップデート確認
export const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      registration.update()
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新しいバージョンが利用可能
              if (confirm('新しいバージョンが利用可能です。今すぐ更新しますか？')) {
                window.location.reload()
              }
            }
          })
        }
      })
    }
  }
}