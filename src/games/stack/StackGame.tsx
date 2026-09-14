import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Trophy,
  RotateCcw,
  Layers,
  Home,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Block = {
  x: number
  width: number
}

type LeaderboardPlayer = {
  id: number
  username: string
  score: number
  position: number
  is_me: boolean
}

type ScoreResult = {
  success: boolean
  game: string
  score: number
  record: number
  is_new_record?: boolean
  position: number
  players: LeaderboardPlayer[]
  message?: string
}

const GAME_WIDTH = 800
const BLOCK_HEIGHT = 42
const INITIAL_BLOCK_WIDTH = 260
const INITIAL_X = (GAME_WIDTH - INITIAL_BLOCK_WIDTH) / 2
const BLOCK_GAP = 3

const DEVICE_TOKEN_KEY = 'reflex-games-device-token'
const BEST_SCORE_KEY = 'stack-best-score'

function StackGame() {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL

  const gameAreaRef = useRef<HTMLDivElement | null>(null)
  const movementAnimationRef = useRef<number | null>(null)
  const cameraAnimationRef = useRef<number | null>(null)

  const hitSound = useRef<HTMLAudioElement | null>(null)
  const gameOverSound = useRef<HTMLAudioElement | null>(null)

  const directionRef = useRef(1)
  const speedRef = useRef(3)

  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState<number>(() => {
    return Number(localStorage.getItem(BEST_SCORE_KEY) || 0)
  })

  const [blocks, setBlocks] = useState<Block[]>([])
  const [currentBlock, setCurrentBlock] = useState({
    x: 0,
    width: INITIAL_BLOCK_WIDTH,
  })
  const [cameraOffset, setCameraOffset] = useState(0)

  // Backend API states
  const [submittingScore, setSubmittingScore] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [scoreError, setScoreError] = useState('')

  /*
   * Sounds
   */
  useEffect(() => {
    hitSound.current = new Audio('/sounds/hit.wav')
    hitSound.current.volume = 0.45

    gameOverSound.current = new Audio('/sounds/gameover.wav')
    gameOverSound.current.volume = 0.6

    return () => {
      if (movementAnimationRef.current) {
        cancelAnimationFrame(movementAnimationRef.current)
      }
      if (cameraAnimationRef.current) {
        cancelAnimationFrame(cameraAnimationRef.current)
      }
      hitSound.current = null
      gameOverSound.current = null
    }
  }, [])

  const playHitSound = () => {
    if (!hitSound.current) return
    hitSound.current.currentTime = 0
    hitSound.current.play().catch(() => {})
  }

  const playGameOverSound = () => {
    if (!gameOverSound.current) return
    gameOverSound.current.currentTime = 0
    gameOverSound.current.play().catch(() => {})
  }

  /*
   * Submit Score to Backend
   */
  const submitScore = useCallback(
    async (finalScore: number) => {
      try {
        setSubmittingScore(true)
        setScoreError('')
        setScoreResult(null)

        const deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY)

        if (!deviceToken) {
          throw new Error('شناسه دستگاه کاربر پیدا نشد.')
        }

        const response = await fetch(`${apiUrl}/index.php?route=score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            game: 'stack',
            device_token: deviceToken,
            score: finalScore,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'ثبت امتیاز ناموفق بود.')
        }

        setScoreResult(data)

        if (typeof data.record === 'number') {
          setBestScore(data.record)
          localStorage.setItem(BEST_SCORE_KEY, String(data.record))
        }
      } catch (error) {
        console.error('Score submission error:', error)
        setScoreError(
          error instanceof Error
            ? error.message
            : 'خطایی هنگام ثبت امتیاز رخ داد.',
        )
      } finally {
        setSubmittingScore(false)
      }
    },
    [apiUrl],
  )

  /*
   * Start Game
   */
  const startGame = () => {
    if (movementAnimationRef.current) {
      cancelAnimationFrame(movementAnimationRef.current)
      movementAnimationRef.current = null
    }

    if (cameraAnimationRef.current) {
      cancelAnimationFrame(cameraAnimationRef.current)
      cameraAnimationRef.current = null
    }

    setScore(0)
    setGameOver(false)
    setScoreResult(null)
    setScoreError('')
    setSubmittingScore(false)
    setCameraOffset(0)

    setBlocks([
      {
        x: INITIAL_X,
        width: INITIAL_BLOCK_WIDTH,
      },
    ])

    setCurrentBlock({
      x: 0,
      width: INITIAL_BLOCK_WIDTH,
    })

    directionRef.current = 1
    speedRef.current = 3
    setGameStarted(true)
  }

  /*
   * Continuous Moving Block Loop
   */
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const animate = () => {
      setCurrentBlock((block) => {
        const maxX = GAME_WIDTH - block.width
        let nextX = block.x + directionRef.current * speedRef.current

        if (nextX <= 0) {
          nextX = 0
          directionRef.current = 1
        }

        if (nextX >= maxX) {
          nextX = maxX
          directionRef.current = -1
        }

        return {
          ...block,
          x: nextX,
        }
      })

      movementAnimationRef.current = requestAnimationFrame(animate)
    }

    movementAnimationRef.current = requestAnimationFrame(animate)

    return () => {
      if (movementAnimationRef.current) {
        cancelAnimationFrame(movementAnimationRef.current)
        movementAnimationRef.current = null
      }
    }
  }, [gameStarted, gameOver])

  /*
   * Smooth Camera Scroll
   */
  const animateCamera = (from: number, to: number) => {
    if (cameraAnimationRef.current) {
      cancelAnimationFrame(cameraAnimationRef.current)
    }

    if (from === to) {
      setCameraOffset(to)
      return
    }

    const duration = 280
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = from + (to - from) * eased

      setCameraOffset(value)

      if (progress < 1) {
        cameraAnimationRef.current = requestAnimationFrame(animate)
      } else {
        cameraAnimationRef.current = null
        setCameraOffset(to)
      }
    }

    cameraAnimationRef.current = requestAnimationFrame(animate)
  }

  /*
   * Drop Block Handler
   */
  const dropBlock = () => {
    if (!gameStarted || gameOver) return

    const previousBlock = blocks[blocks.length - 1]
    if (!previousBlock) return

    const currentLeft = currentBlock.x
    const currentRight = currentBlock.x + currentBlock.width

    const previousLeft = previousBlock.x
    const previousRight = previousBlock.x + previousBlock.width

    const overlapLeft = Math.max(currentLeft, previousLeft)
    const overlapRight = Math.min(currentRight, previousRight)
    const overlapWidth = overlapRight - overlapLeft

    // Missed
    if (overlapWidth <= 0) {
      setGameStarted(false)
      setGameOver(true)
      playGameOverSound()
      submitScore(score)
      return
    }

    // Success
    playHitSound()

    const newBlock: Block = {
      x: overlapLeft,
      width: overlapWidth,
    }

    const newScore = score + 1

    setBlocks((currentBlocks) => [...currentBlocks, newBlock])
    setScore(newScore)

    // Progressive speed
    speedRef.current = Math.min(9, speedRef.current + 0.18)
    directionRef.current *= -1

    const nextTowerHeight = (blocks.length + 1) * BLOCK_HEIGHT
    const gameHeight = gameAreaRef.current?.clientHeight ?? 600
    const safeHeight = gameHeight - 140
    const nextCameraOffset = Math.max(0, nextTowerHeight - safeHeight)

    animateCamera(cameraOffset, nextCameraOffset)

    setCurrentBlock({
      x:
        directionRef.current === 1
          ? 0
          : GAME_WIDTH - overlapWidth,
      width: overlapWidth,
    })
  }

  const isPlaying = gameStarted && !gameOver

  return (
    <main className="min-h-screen bg-[#08090D] text-white" dir="rtl">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-5 sm:py-8">

        {/* Header */}
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label="بازگشت"
            >
              <ArrowRight size={20} />
            </button>

            <div>
              <h1 className="text-xl font-black sm:text-2xl">برج‌سازی</h1>
              <p className="text-xs text-zinc-500">تا جایی که می‌تونی بالا برو</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Trophy size={17} className="text-yellow-400" />
            <div className="text-right">
              <div className="text-[10px] text-white/40">بهترین رکورد</div>
              <div className="text-sm font-black">{bestScore}</div>
            </div>
          </div>
        </header>

        {/* Start Screen */}
        {!isPlaying && !gameOver && (
          <section className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 text-center shadow-2xl sm:p-9">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
                <Layers size={40} strokeWidth={1.7} />
              </div>

              <h2 className="text-3xl font-black">برجت رو بساز</h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                بلوک متحرک رو در زمان مناسب بنداز و برجت رو بلندتر کن. اگه
                بیرون از بلوک قبلی فرود بیاد، بازی تمومه.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xs text-zinc-500">هدف</p>
                  <p className="mt-1 font-bold">ساختن برج</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xs text-zinc-500">اشتباه</p>
                  <p className="mt-1 font-bold">پایان بازی</p>
                </div>
              </div>

              <button
                onClick={startGame}
                className="mt-7 w-full rounded-2xl bg-white px-5 py-4 font-bold text-black transition hover:scale-[1.02] active:scale-[0.98]"
              >
                شروع بازی
              </button>
            </div>
          </section>
        )}

        {/* Game Area */}
        {isPlaying && (
          <section className="flex flex-1 flex-col">
            {/* Stats */}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center sm:p-4">
                <p className="text-xs text-zinc-500">طبقه</p>
                <p className="mt-1 text-xl font-black sm:text-2xl">{score}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center sm:p-4">
                <p className="text-xs text-zinc-500">عرض بلوک</p>
                <p className="mt-1 text-xl font-black sm:text-2xl">
                  {Math.round(currentBlock.width)}
                </p>
              </div>

              <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center sm:block sm:p-4">
                <p className="text-xs text-zinc-500">رکورد</p>
                <p className="mt-1 text-xl font-black sm:text-2xl">{bestScore}</p>
              </div>
            </div>

            {/* Canvas / Arena */}
            <div
              ref={gameAreaRef}
              dir="ltr"
              onClick={dropBlock}
              className="relative min-h-[500px] flex-1 cursor-pointer select-none overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] shadow-inner sm:min-h-[600px]"
            >
              {/* Grid */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Tower */}
              <div
                className="pointer-events-none absolute left-1/2"
                style={{
                  width: GAME_WIDTH,
                  height: blocks.length * BLOCK_HEIGHT,
                  bottom: 32 - cameraOffset,
                  transform: 'translateX(-50%)',
                }}
              >
                {blocks.map((block, index) => (
                  <div
                    key={index}
                    className="absolute rounded-lg bg-white shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                    style={{
                      width: block.width,
                      height: BLOCK_HEIGHT - BLOCK_GAP,
                      left: block.x,
                      bottom: index * BLOCK_HEIGHT,
                    }}
                  />
                ))}
              </div>

              {/* Moving Block */}
              <div
                className="pointer-events-none absolute rounded-lg border border-white/30 bg-white/80 text-black shadow-[0_0_25px_rgba(255,255,255,0.18)]"
                style={{
                  width: currentBlock.width,
                  height: BLOCK_HEIGHT - BLOCK_GAP,
                  left: `calc(50% - ${GAME_WIDTH / 2}px + ${currentBlock.x}px)`,
                  top: 32,
                }}
              />

              {/* Instruction */}
              <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/5 bg-black/40 px-4 py-2 text-xs text-zinc-400 backdrop-blur-sm">
                برای رها کردن بلوک کلیک یا لمس کنید
              </div>
            </div>
          </section>
        )}

        {/* Game Over Modal with Leaderboard */}
        {gameOver && (
          <section className="flex flex-1 items-center justify-center">
            <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl sm:p-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
                <Trophy size={34} strokeWidth={1.7} className="text-yellow-400" />
              </div>

              <p className="text-xs text-zinc-500">برج فرو ریخت!</p>

              <h2 className="mt-1 text-5xl font-black">{score}</h2>
              <p className="mt-1 text-xs text-zinc-400">طبقه ساخته شده</p>

              {/* Submitting State */}
              {submittingScore && (
                <p className="mt-4 text-xs text-zinc-500 animate-pulse">
                  در حال ثبت امتیاز در سرور...
                </p>
              )}

              {/* Error State */}
              {scoreError && (
                <p className="mt-4 text-xs text-red-400">{scoreError}</p>
              )}

              {/* New Record Banner */}
              {!submittingScore &&
                scoreResult &&
                (scoreResult.is_new_record ||
                  (scoreResult.record > 0 &&
                    score >= scoreResult.record)) && (
                  <p className="mt-4 text-xs font-bold text-emerald-400">
                    🎉 رکورد جدید ثبت شد!
                  </p>
                )}

              {/* Leaderboard & Stats */}
              {scoreResult && (
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs text-zinc-500">رتبه شما در جدول</p>
                    <p className="mt-1 text-2xl font-black">
                      #{scoreResult.position}
                    </p>
                  </div>

                  {scoreResult.players && scoreResult.players.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <div className="border-b border-white/10 bg-white/[0.03] px-3 py-2 text-right">
                        <p className="text-[11px] font-bold text-zinc-400">
                          جدول برترین‌ها
                        </p>
                      </div>

                      <div className="divide-y divide-white/5">
                        {scoreResult.players.map((playerItem) => (
                          <div
                            key={playerItem.id}
                            className={`flex items-center gap-2 px-3 py-2 text-xs ${
                              playerItem.is_me ? 'bg-white/[0.08]' : ''
                            }`}
                          >
                            <div className="w-6 text-center font-bold text-zinc-500">
                              #{playerItem.position}
                            </div>

                            <div className="min-w-0 flex-1 text-right">
                              <p
                                className={`truncate font-bold ${
                                  playerItem.is_me
                                    ? 'text-white'
                                    : 'text-zinc-300'
                                }`}
                              >
                                {playerItem.username}
                                {playerItem.is_me && (
                                  <span className="mr-1 text-[10px] text-zinc-500">
                                    (شما)
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="font-black text-white">
                              {playerItem.score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={startGame}
                  disabled={submittingScore}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 font-bold text-black transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={17} />
                  دوباره بازی کن
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <Home size={17} />
                  خانه
                </button>
              </div>
            </div>
          </section>
        )}

      </div>
    </main>
  )
}

export default StackGame