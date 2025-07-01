// このスクリプトはアイコン生成用の参考コードです
// 実際のアイコンファイルは以下のコードを参考に作成してください

const createIcon = (size, color = '#3b82f6') => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = size
  canvas.height = size

  // 背景（角丸四角形）
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()

  // チェックマークアイコン
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = size * 0.08
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // チェックボックス
  const boxSize = size * 0.4
  const boxX = (size - boxSize) / 2
  const boxY = size * 0.25

  ctx.strokeRect(boxX, boxY, boxSize, boxSize * 0.7)

  // チェックマーク
  ctx.beginPath()
  ctx.moveTo(boxX + boxSize * 0.2, boxY + boxSize * 0.35)
  ctx.lineTo(boxX + boxSize * 0.4, boxY + boxSize * 0.55)
  ctx.lineTo(boxX + boxSize * 0.8, boxY + boxSize * 0.15)
  ctx.stroke()

  // タスクライン
  const lineY = boxY + boxSize + size * 0.1
  for (let i = 0; i < 3; i++) {
    const y = lineY + i * (size * 0.08)
    const width = size * (0.6 - i * 0.1)
    ctx.beginPath()
    ctx.moveTo((size - width) / 2, y)
    ctx.lineTo((size + width) / 2, y)
    ctx.stroke()
  }

  return canvas.toDataURL('image/png')
}

// 各サイズのアイコンを生成
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512]
sizes.forEach(size => {
  const iconData = createIcon(size)
  console.log(`icon-${size}x${size}.png generated`)
  
  // ダウンロード用リンク作成（ブラウザで実行する場合）
  if (typeof window !== 'undefined') {
    const link = document.createElement('a')
    link.download = `icon-${size}x${size}.png`
    link.href = iconData
    link.click()
  }
})

// Apple Touch Icon (180x180)
const appleTouchIcon = createIcon(180, '#3b82f6')
console.log('apple-touch-icon.png generated')

// Favicon (32x32, 16x16)
const favicon32 = createIcon(32)
const favicon16 = createIcon(16)
console.log('favicon icons generated')