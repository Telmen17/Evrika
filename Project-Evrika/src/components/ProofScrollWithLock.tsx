import type { FC } from 'react'
import { useEffect, useRef } from 'react'
import padlockPng from '../assets/padlock.png'

/** Served from `public/gifs/Unlock.mp4`. */
export const UNLOCK_VIDEO_SRC = '/gifs/Unlock.mp4'

interface ProofScrollWithLockProps {
  scrollSrc: string
  scrollImgClassName: string
  stackClassName?: string
  showPadlock: boolean
  playUnlockVideo: boolean
  onUnlockVideoEnded: () => void
}

/**
 * Scroll art at full opacity, optional padlock overlay, optional unlock animation on top.
 */
export const ProofScrollWithLock: FC<ProofScrollWithLockProps> = ({
  scrollSrc,
  scrollImgClassName,
  stackClassName = '',
  showPadlock,
  playUnlockVideo,
  onUnlockVideoEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!playUnlockVideo) return
    const el = videoRef.current
    if (!el) return
    el.currentTime = 0
    void el.play().catch(() => onUnlockVideoEnded())
  }, [playUnlockVideo, onUnlockVideoEnded])

  return (
    <div className={`proof-scroll-stack ${stackClassName}`.trim()}>
      <img src={scrollSrc} alt="" className={scrollImgClassName} />
      {showPadlock ? (
        <img src={padlockPng} alt="" className="proof-scroll-padlock" />
      ) : null}
      {playUnlockVideo ? (
        <video
          ref={videoRef}
          className="proof-scroll-unlock-video"
          src={UNLOCK_VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          onEnded={onUnlockVideoEnded}
          aria-hidden
        />
      ) : null}
    </div>
  )
}
