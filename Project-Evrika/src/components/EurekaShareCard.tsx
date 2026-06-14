import { useCallback, useEffect, useRef, useState } from 'react'

interface EurekaShareCardProps {
  open: boolean
  onClose: () => void
}

/** Edit this once the lesson is deployed so shared links point at the live site. */
const SHARE_URL =
  typeof window !== 'undefined' ? window.location.origin : 'https://evrika.app'
const SHARE_TITLE = "Archimedes' Eureka Experience"
const SHARE_TEXT =
  "I just exposed King Hiero's counterfeit crown using density and a splash of water — Eureka! Can you crack it too?"

const CARD_W = 1200
const CARD_H = 630
const DOWNLOAD_NAME = 'eureka-archimedes.png'

type CopyState = 'idle' | 'copied'

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawCrown(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
  const h = w * 0.66
  const left = cx - w / 2
  const right = cx + w / 2
  const baseTop = cy + h * 0.18
  const bottom = cy + h * 0.5

  const grad = ctx.createLinearGradient(0, cy - h / 2, 0, bottom)
  grad.addColorStop(0, '#ffe9a8')
  grad.addColorStop(0.5, '#f3c64b')
  grad.addColorStop(1, '#c8901f')

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(left, baseTop)
  ctx.lineTo(left, bottom)
  ctx.lineTo(right, bottom)
  ctx.lineTo(right, baseTop)
  // right peak
  ctx.lineTo(right - w * 0.06, cy - h * 0.18)
  ctx.lineTo(cx + w * 0.2, baseTop - h * 0.04)
  // center peak
  ctx.lineTo(cx, cy - h * 0.5)
  ctx.lineTo(cx - w * 0.2, baseTop - h * 0.04)
  // left peak
  ctx.lineTo(left + w * 0.06, cy - h * 0.18)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.shadowColor = 'rgba(120, 80, 20, 0.45)'
  ctx.shadowBlur = 26
  ctx.shadowOffsetY = 10
  ctx.fill()
  ctx.restore()

  // gems on the peaks
  const gems: Array<[number, number, string]> = [
    [cx, cy - h * 0.5, '#e8556b'],
    [right - w * 0.06, cy - h * 0.18, '#5bb0e8'],
    [left + w * 0.06, cy - h * 0.18, '#5bb0e8'],
  ]
  for (const [gx, gy, color] of gems) {
    ctx.beginPath()
    ctx.arc(gx, gy, w * 0.035, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.stroke()
  }

  // band line
  ctx.beginPath()
  ctx.moveTo(left, baseTop + h * 0.06)
  ctx.lineTo(right, baseTop + h * 0.06)
  ctx.lineWidth = w * 0.03
  ctx.strokeStyle = 'rgba(120, 80, 20, 0.35)'
  ctx.stroke()
}

function drawCard(ctx: CanvasRenderingContext2D) {
  // parchment background
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H)
  bg.addColorStop(0, '#f7ecd1')
  bg.addColorStop(0.55, '#efdcb0')
  bg.addColorStop(1, '#e2cb96')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // soft glow
  const glow = ctx.createRadialGradient(
    CARD_W / 2,
    CARD_H * 0.4,
    40,
    CARD_W / 2,
    CARD_H * 0.4,
    CARD_W * 0.7,
  )
  glow.addColorStop(0, 'rgba(255,246,214,0.85)')
  glow.addColorStop(1, 'rgba(255,246,214,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // double gold frame
  ctx.strokeStyle = 'rgba(160, 114, 42, 0.85)'
  ctx.lineWidth = 6
  roundRect(ctx, 26, 26, CARD_W - 52, CARD_H - 52, 26)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(196, 150, 70, 0.6)'
  ctx.lineWidth = 2
  roundRect(ctx, 40, 40, CARD_W - 80, CARD_H - 80, 20)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // kicker
  ctx.fillStyle = '#a0722a'
  ctx.font = '700 26px Georgia, "Times New Roman", serif'
  ctx.save()
  ctx.translate(CARD_W / 2, 96)
  ctx.fillText('A R C H I M E D E S \u2019   E U R E K A   E X P E R I E N C E', 0, 0)
  ctx.restore()

  drawCrown(ctx, CARD_W / 2, 210, 200)

  // headline
  ctx.fillStyle = '#4a3112'
  ctx.font = '800 116px Georgia, "Times New Roman", serif'
  ctx.shadowColor = 'rgba(160, 114, 42, 0.35)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6
  ctx.fillText('EUREKA!', CARD_W / 2, 348)
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // subtitle
  ctx.fillStyle = '#5a3e1b'
  ctx.font = '500 34px Georgia, "Times New Roman", serif'
  ctx.fillText(
    "I exposed the King\u2019s counterfeit crown using density.",
    CARD_W / 2,
    420,
  )

  // divider
  ctx.strokeStyle = 'rgba(160, 114, 42, 0.4)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(CARD_W / 2 - 230, 470)
  ctx.lineTo(CARD_W / 2 + 230, 470)
  ctx.stroke()

  // challenge CTA
  ctx.fillStyle = '#7a5418'
  ctx.font = '700 30px Georgia, "Times New Roman", serif'
  ctx.fillText('Can you spot the fake crown?', CARD_W / 2, 512)

  ctx.fillStyle = 'rgba(90, 62, 27, 0.85)'
  ctx.font = '500 24px Georgia, "Times New Roman", serif'
  const host = SHARE_URL.replace(/^https?:\/\//, '')
  ctx.fillText(`Play the experiment \u2192 ${host}`, CARD_W / 2, 556)
}

export function EurekaShareCard({ open, onClose }: EurekaShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    )
  }, [])

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCard(ctx)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const getBlob = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const canvas = canvasRef.current
        if (!canvas) return resolve(null)
        canvas.toBlob((b) => resolve(b), 'image/png')
      }),
    [],
  )

  const handleDownload = useCallback(async () => {
    const blob = await getBlob()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = DOWNLOAD_NAME
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }, [getBlob])

  const handleNativeShare = useCallback(async () => {
    setBusy(true)
    try {
      const blob = await getBlob()
      const shareData: ShareData = {
        title: SHARE_TITLE,
        text: SHARE_TEXT,
        url: SHARE_URL,
      }
      if (blob) {
        const file = new File([blob], DOWNLOAD_NAME, { type: 'image/png' })
        const navAny = navigator as Navigator & {
          canShare?: (data?: ShareData & { files?: File[] }) => boolean
        }
        if (navAny.canShare && navAny.canShare({ files: [file] })) {
          await navigator.share({ ...shareData, files: [file] } as ShareData)
          setBusy(false)
          return
        }
      }
      await navigator.share(shareData)
    } catch {
      /* user cancelled or unsupported */
    }
    setBusy(false)
  }, [getBlob])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${SHARE_URL}`)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      /* clipboard blocked */
    }
  }, [])

  if (!open) return null

  const encodedText = encodeURIComponent(SHARE_TEXT)
  const encodedUrl = encodeURIComponent(SHARE_URL)
  const intents: Array<{ id: string; label: string; href: string }> = [
    {
      id: 'x',
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      id: 'reddit',
      label: 'Reddit',
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(SHARE_TITLE)}`,
    },
  ]

  return (
    <div className="eureka-share" role="dialog" aria-modal="true" aria-label="Share your Eureka">
      <button
        type="button"
        className="eureka-share-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="eureka-share-modal">
        <button
          type="button"
          className="eureka-share-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="eureka-share-head">
          <p className="eureka-share-kicker">Eureka!</p>
          <h2 className="eureka-share-title">You cracked the crown mystery</h2>
          <p className="eureka-share-sub">
            Share your badge and dare a friend to spot the fake.
          </p>
        </div>

        <div className="eureka-share-preview">
          <canvas
            ref={canvasRef}
            width={CARD_W}
            height={CARD_H}
            className="eureka-share-canvas"
            aria-label="Eureka achievement card preview"
          />
        </div>

        <div className="eureka-share-actions">
          {canNativeShare ? (
            <button
              type="button"
              className="eureka-share-primary"
              onClick={handleNativeShare}
              disabled={busy}
            >
              {busy ? 'Sharing…' : 'Share'}
            </button>
          ) : null}
          <button type="button" className="eureka-share-secondary" onClick={handleDownload}>
            Download image
          </button>
          <button type="button" className="eureka-share-secondary" onClick={handleCopyLink}>
            {copyState === 'copied' ? 'Copied!' : 'Copy link'}
          </button>
        </div>

        <div className="eureka-share-intents">
          {intents.map((intent) => (
            <a
              key={intent.id}
              className={`eureka-share-intent eureka-share-intent--${intent.id}`}
              href={intent.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {intent.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
