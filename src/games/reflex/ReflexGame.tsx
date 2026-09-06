import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Target,
  Trophy,
  RotateCcw,
  X,
} from 'lucide-react'

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
  position: number
  players: LeaderboardPlayer[]
  message?: string
}

const DEVICE_TOKEN_KEY = 'reflex-games-device-token'

function ReflexGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)

  const [targetPosition, setTargetPosition] = useState({
    x: 50,
    y: 50,
  })

  const [targetSize, setTargetSize] = useState(64)

  const [gameOverReason, setGameOverReason] = useState<
    'timeout' | 'miss' | null
  >(null)

  const [scoreResult, setScoreResult] =
    useState<ScoreResult | null>(null)

  const [submittingScore, setSubmittingScore] =
    useState(false)

  const [scoreError, setScoreError] = useState('')

  const hitSound = useRef<HTMLAudioElement | null>(null)
  const gameOverSound = useRef<HTMLAudioElement | null>(null)

  const MAX_TARGET_SIZE = 64
  const MIN_TARGET_SIZE = 32
  const SIZE_DECREASE = 2

  const apiUrl = import.meta.env.VITE_API_URL

  /*
  |--------------------------------------------------------------------------
  | Audio
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    hitSound.current = new Audio('/sounds/hit.wav')
    hitSound.current.volume = 0.5

    gameOverSound.current = new Audio('/sounds/gameover.wav')
    gameOverSound.current.volume = 0.6

    return () => {
      hitSound.current = null
      gameOverSound.current = null
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Game over sound
  |--------------------------------------------------------------------------
  */

  const playGameOverSound = () => {
    if (gameOverSound.current) {
      gameOverSound.current.currentTime = 0

      gameOverSound.current
        .play()
        .catch(() => {
          // Ignore browser autoplay errors
        })
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Submit score
  |--------------------------------------------------------------------------
  */

  const submitScore = async (finalScore: number) => {
    try {
      setSubmittingScore(true)
      setScoreError('')
      setScoreResult(null)

      const deviceToken = localStorage.getItem(
        DEVICE_TOKEN_KEY
      )

      if (!deviceToken) {
        throw new Error(
          'شناسه کاربر پیدا نشد.'
        )
      }

      const response = await fetch(
        `${apiUrl}/index.php?route=score`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            game: 'reflex',
            device_token: deviceToken,
            score: finalScore,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          'ثبت امتیاز ناموفق بود.'
        )
      }

      setScoreResult(data)

      // Backend is the source of truth
      setBestScore(data.record)

    } catch (error) {
      console.error(
        'Failed to submit score:',
        error
      )

      setScoreError(
        error instanceof Error
          ? error.message
          : 'خطایی هنگام ثبت امتیاز رخ داد.'
      )
    } finally {
      setSubmittingScore(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Finish game
  |--------------------------------------------------------------------------
  */

  const finishGame = (
    reason: 'timeout' | 'miss'
  ) => {
    setGameStarted(false)
    setGameOverReason(reason)

    playGameOverSound()

    // Send final score to backend
    submitScore(score)
  }

  /*
  |--------------------------------------------------------------------------
  | Start game
  |--------------------------------------------------------------------------
  */

  const startGame = () => {
    setScore(0)
    setTimeLeft(30)
    setGameOverReason(null)

    setScoreResult(null)
    setScoreError('')
    setSubmittingScore(false)

    setTargetPosition({
      x: 50,
      y: 50,
    })

    setTargetSize(MAX_TARGET_SIZE)

    setGameStarted(true)
  }

  /*
  |--------------------------------------------------------------------------
  | Timer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) {
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((time) => time - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, timeLeft])

  /*
  |--------------------------------------------------------------------------
  | Timeout
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (timeLeft === 0 && gameStarted) {
      finishGame('timeout')
    }
  }, [timeLeft, gameStarted])

  /*
  |--------------------------------------------------------------------------
  | Random target position
  |--------------------------------------------------------------------------
  */

  const getRandomPosition = () => {
    const x = 10 + Math.random() * 80
    const y = 10 + Math.random() * 80

    return {
      x,
      y,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Hit target
  |--------------------------------------------------------------------------
  */

  const hitTarget = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation()

    if (!gameStarted || timeLeft <= 0) {
      return
    }

    if (hitSound.current) {
      hitSound.current.currentTime = 0

      hitSound.current
        .play()
        .catch(() => {
          // Ignore browser autoplay errors
        })
    }

    const newScore = score + 1

    setScore(newScore)

    setTargetPosition(getRandomPosition())

    setTargetSize((currentSize) =>
      Math.max(
        MIN_TARGET_SIZE,
        currentSize - SIZE_DECREASE
      )
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Miss target
  |--------------------------------------------------------------------------
  */

  const missTarget = () => {
    if (!gameStarted || timeLeft <= 0) {
      return
    }

    finishGame('miss')
  }

  const isGameOver =
    !gameStarted &&
    gameOverReason !== null

  return (
    <main className="min-h-screen bg-[#08090D] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-5 sm:py-8">

        {/* Header */}
        <header className="mb-5 flex items-center gap-3">

          <button
            onClick={() => window.history.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowRight size={20} />
          </button>

          <div>

            <h1 className="text-xl font-black sm:text-2xl">
              رفلکس
            </h1>

            <p className="text-xs text-zinc-500">
              سرعت و دقتت رو امتحان کن
            </p>

          </div>

        </header>

        {/* Start Screen */}
        {!gameStarted && !isGameOver && (
          <section className="flex flex-1 items-center justify-center">

            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 text-center shadow-2xl sm:p-9">

              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
                <Target
                  size={40}
                  strokeWidth={1.7}
                />
              </div>

              <h2 className="text-3xl font-black">
                آماده‌ای؟
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                هدف رو پیدا کن و سریع بزن.
                اما مراقب باش! اگه جای اشتباه کلیک کنی، بازی تموم میشه.
              </p>

              <div className="mt-7 grid grid-cols-3 gap-2">

                <div className="rounded-2xl bg-white/5 p-3">

                  <p className="text-xs text-zinc-500">
                    زمان
                  </p>

                  <p className="mt-1 font-bold">
                    ۳۰ ثانیه
                  </p>

                </div>

                <div className="rounded-2xl bg-white/5 p-3">

                  <p className="text-xs text-zinc-500">
                    هدف
                  </p>

                  <p className="mt-1 font-bold">
                    متحرک
                  </p>

                </div>

                <div className="rounded-2xl bg-white/5 p-3">

                  <p className="text-xs text-zinc-500">
                    اشتباه
                  </p>

                  <p className="mt-1 font-bold">
                    پایان بازی
                  </p>

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

        {/* Game */}
        {gameStarted && (
          <section className="flex flex-1 flex-col">

            {/* Stats */}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center sm:p-4">

                <p className="text-xs text-zinc-500">
                  امتیاز
                </p>

                <p className="mt-1 text-xl font-black sm:text-2xl">
                  {score}
                </p>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center sm:p-4">

                <p className="text-xs text-zinc-500">
                  زمان
                </p>

                <p
                  className={`mt-1 text-xl font-black sm:text-2xl ${
                    timeLeft <= 5
                      ? 'text-red-400'
                      : ''
                  }`}
                >
                  {timeLeft}
                </p>

              </div>

              <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center sm:block sm:p-4">

                <p className="text-xs text-zinc-500">
                  رکورد
                </p>

                <p className="mt-1 text-xl font-black sm:text-2xl">
                  {bestScore}
                </p>

              </div>

            </div>

            {/* Game Area */}
            <div
              onClick={missTarget}
              className="relative min-h-[500px] flex-1 cursor-crosshair overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] shadow-inner sm:min-h-[600px]"
            >

              {/* Background grid */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Target */}
              <button
                onClick={hitTarget}
                aria-label="هدف"
                className="
                  absolute
                  flex
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  text-black
                  shadow-[0_0_35px_rgba(255,255,255,0.25)]
                  transition-[left,top,width,height,transform,box-shadow]
                  duration-75
                  ease-out
                  hover:scale-110
                  hover:shadow-[0_0_45px_rgba(255,255,255,0.4)]
                  active:scale-90
                "
                style={{
                  width: targetSize,
                  height: targetSize,
                  left: `${targetPosition.x}%`,
                  top: `${targetPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <Target
                  size={Math.max(
                    18,
                    targetSize * 0.47
                  )}
                  strokeWidth={2}
                />
              </button>

              {/* Instructions */}
              <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-zinc-600">
                فقط روی هدف کلیک کن
              </div>

            </div>

          </section>
        )}

        {/* Game Over */}
        {isGameOver && (
          <section className="flex flex-1 items-center justify-center">

            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">

              {/* Icon */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">

                {gameOverReason === 'miss' ? (
                  <X size={38} />
                ) : (
                  <Trophy size={38} />
                )}

              </div>

              <p className="text-sm text-zinc-500">
                {gameOverReason === 'miss'
                  ? 'اشتباه کردی!'
                  : 'زمان تمام شد'}
              </p>

              {/* Score */}
              <h2 className="mt-2 text-6xl font-black">
                {score}
              </h2>

              <p className="mt-2 text-zinc-400">
                امتیاز
              </p>

              {/* Submitting */}
              {submittingScore && (
                <p className="mt-5 text-sm text-zinc-500">
                  در حال ثبت امتیاز...
                </p>
              )}

              {/* Error */}
              {scoreError && (
                <p className="mt-5 text-xs text-red-400">
                  {scoreError}
                </p>
              )}

              {/* New record */}
              {!submittingScore &&
                scoreResult &&
                score === scoreResult.record &&
                scoreResult.record > 0 && (
                  <p className="mt-4 text-sm font-bold">
                    رکورد جدید!
                  </p>
                )}

              {/* Backend result */}
              {scoreResult && (
                <>

                  {/* Personal record */}
                  <div className="mt-7 flex items-center justify-center gap-2 text-sm text-zinc-500">

                    <Trophy size={16} />

                    بهترین رکورد: {scoreResult.record}

                  </div>

                  {/* Position */}
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                    <p className="text-xs text-zinc-500">
                      رتبه شما
                    </p>

                    <p className="mt-1 text-3xl font-black">
                      #{scoreResult.position}
                    </p>

                  </div>

                  {/* Leaderboard */}
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">

                    <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3 text-right">

                      <p className="text-xs font-bold text-zinc-400">
                        جدول امتیازات
                      </p>

                    </div>

                    <div className="divide-y divide-white/5">

                      {scoreResult.players.map(
                        (player) => (
                          <div
                            key={player.id}
                            className={`flex items-center gap-3 px-4 py-3 ${
                              player.is_me
                                ? 'bg-white/[0.08]'
                                : ''
                            }`}
                          >

                            <div className="w-8 text-center text-xs font-bold text-zinc-600">
                              #{player.position}
                            </div>

                            <div className="min-w-0 flex-1 text-right">

                              <p
                                className={`truncate text-sm font-bold ${
                                  player.is_me
                                    ? 'text-white'
                                    : 'text-zinc-300'
                                }`}
                              >
                                {player.username}

                                {player.is_me && (
                                  <span className="mr-2 text-[10px] text-zinc-500">
                                    شما
                                  </span>
                                )}

                              </p>

                            </div>

                            <div className="text-sm font-black">
                              {player.score}
                            </div>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                </>
              )}

              {/* Play again */}
              <button
                onClick={startGame}
                disabled={submittingScore}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-bold text-black transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <RotateCcw size={18} />

                {submittingScore
                  ? 'در حال ثبت...'
                  : 'دوباره بازی کن'}

              </button>

            </div>

          </section>
        )}

      </div>
    </main>
  )
}

export default ReflexGame