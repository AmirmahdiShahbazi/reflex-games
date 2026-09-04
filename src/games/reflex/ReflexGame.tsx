
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Target, Trophy, RotateCcw, X } from 'lucide-react'

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

  // Sounds
  const hitSound = useRef<HTMLAudioElement | null>(null)
  const gameOverSound = useRef<HTMLAudioElement | null>(null)

  const MAX_TARGET_SIZE = 64
  const MIN_TARGET_SIZE = 32
  const SIZE_DECREASE = 2

  // Create audio once
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

  const startGame = () => {
    setScore(0)
    setTimeLeft(30)
    setGameOverReason(null)

    setTargetPosition({
      x: 50,
      y: 50,
    })

    setTargetSize(MAX_TARGET_SIZE)

    setGameStarted(true)
  }

  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) {
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((time) => time - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && gameStarted) {
      setGameStarted(false)
      setGameOverReason('timeout')

      playGameOverSound()

      setBestScore((currentBest) =>
        Math.max(currentBest, score)
      )
    }
  }, [timeLeft, gameStarted, score])

  const getRandomPosition = () => {
    const x = 10 + Math.random() * 80
    const y = 10 + Math.random() * 80

    return { x, y }
  }

  const hitTarget = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation()

    if (!gameStarted || timeLeft <= 0) {
      return
    }

    // Play hit sound
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

    // Move target
    setTargetPosition(getRandomPosition())

    // Make target smaller
    setTargetSize((currentSize) =>
      Math.max(
        MIN_TARGET_SIZE,
        currentSize - SIZE_DECREASE
      )
    )
  }

  const missTarget = () => {
    if (!gameStarted || timeLeft <= 0) {
      return
    }

    setGameStarted(false)
    setGameOverReason('miss')

    // Play game over sound
    playGameOverSound()

    setBestScore((currentBest) =>
      Math.max(currentBest, score)
    )
  }

  const isGameOver = !gameStarted && gameOverReason !== null

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
                <Target size={40} strokeWidth={1.7} />
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
                  size={Math.max(18, targetSize * 0.47)}
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

              <h2 className="mt-2 text-6xl font-black">
                {score}
              </h2>

              <p className="mt-2 text-zinc-400">
                امتیاز
              </p>

              {score >= bestScore && score > 0 && (
                <p className="mt-4 text-sm font-bold">
                  رکورد جدید!
                </p>
              )}

              <div className="mt-7 flex items-center justify-center gap-2 text-sm text-zinc-500">
                <Trophy size={16} />
                بهترین رکورد: {bestScore}
              </div>

              <button
                onClick={startGame}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-bold text-black transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <RotateCcw size={18} />
                دوباره بازی کن
              </button>

            </div>

          </section>
        )}

      </div>
    </main>
  )
}

export default ReflexGame

