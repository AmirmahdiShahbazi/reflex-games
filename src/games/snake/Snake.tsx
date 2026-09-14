import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Home,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Position = {
  x: number
  y: number
}

type Direction = 'up' | 'down' | 'left' | 'right'

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

const BOARD_SIZE = 20
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]

const DEVICE_TOKEN_KEY = 'reflex-games-device-token'
const BEST_SCORE_KEY = 'snake-best-score'

const createInitialSnake = (): Position[] =>
  INITIAL_SNAKE.map((segment) => ({ ...segment }))

const positionsEqual = (a: Position, b: Position): boolean => {
  return a.x === b.x && a.y === b.y
}

const isSnakePosition = (
  position: Position,
  snake: Position[],
): boolean => {
  return snake.some((segment) => positionsEqual(segment, position))
}

const createFood = (snake: Position[]): Position => {
  const emptyCells: Position[] = []

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const position = { x, y }
      if (!isSnakePosition(position, snake)) {
        emptyCells.push(position)
      }
    }
  }

  if (emptyCells.length === 0) {
    return { x: -1, y: -1 }
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)]
}

const isOppositeDirection = (
  current: Direction,
  next: Direction,
): boolean => {
  return (
    (current === 'up' && next === 'down') ||
    (current === 'down' && next === 'up') ||
    (current === 'left' && next === 'right') ||
    (current === 'right' && next === 'left')
  )
}

const getNextHead = (head: Position, direction: Direction): Position => {
  switch (direction) {
    case 'up':
      return { x: head.x, y: head.y - 1 }
    case 'down':
      return { x: head.x, y: head.y + 1 }
    case 'left':
      return { x: head.x - 1, y: head.y }
    case 'right':
      return { x: head.x + 1, y: head.y }
  }
}

function Snake() {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL

  const [snake, setSnake] = useState<Position[]>(createInitialSnake)
  const [food, setFood] = useState<Position>(() =>
    createFood(createInitialSnake()),
  )
  const [direction, setDirection] = useState<Direction>('right')
  const [, setNextDirection] = useState<Direction>('right')

  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState<number>(() => {
    const saved = localStorage.getItem(BEST_SCORE_KEY)
    return saved ? Number(saved) : 0
  })

  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)

  // API states
  const [submittingScore, setSubmittingScore] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [scoreError, setScoreError] = useState('')

  // Refs for real-time game loops
  const scoreRef = useRef(0)
  const directionRef = useRef<Direction>('right')
  const nextDirectionRef = useRef<Direction>('right')
  const snakeRef = useRef<Position[]>(createInitialSnake())
  const foodRef = useRef<Position>(food)
  const gameOverRef = useRef(false)
  const pausedRef = useRef(false)

  const hitSound = useRef<HTMLAudioElement | null>(null)
  const gameOverSound = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    hitSound.current = new Audio('/sounds/hit.wav')
    hitSound.current.volume = 0.25

    gameOverSound.current = new Audio('/sounds/gameover.wav')
    gameOverSound.current.volume = 0.5

    return () => {
      hitSound.current = null
      gameOverSound.current = null
    }
  }, [])

  const playSound = useCallback((type: 'hit' | 'gameover') => {
    const sound = type === 'hit' ? hitSound.current : gameOverSound.current
    if (sound) {
      sound.currentTime = 0
      sound.play().catch(() => {})
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Submit Score to Backend
  |--------------------------------------------------------------------------
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
            game: 'snake',
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
        console.error('Failed to submit score:', error)
        setScoreError(
          error instanceof Error
            ? error.message
            : 'خطایی در ثبت امتیاز رخ داد.',
        )
      } finally {
        setSubmittingScore(false)
      }
    },
    [apiUrl],
  )

  /*
  |--------------------------------------------------------------------------
  | Finish Game Handler
  |--------------------------------------------------------------------------
  */
  const triggerGameOver = useCallback(
    (finalScore: number) => {
      gameOverRef.current = true
      setGameOver(true)
      playSound('gameover')
      submitScore(finalScore)
    },
    [playSound, submitScore],
  )

  /*
  |--------------------------------------------------------------------------
  | Reset Game
  |--------------------------------------------------------------------------
  */
  const resetGame = useCallback(() => {
    const newSnake = createInitialSnake()
    const newFood = createFood(newSnake)

    snakeRef.current = newSnake
    foodRef.current = newFood
    directionRef.current = 'right'
    nextDirectionRef.current = 'right'
    gameOverRef.current = false
    pausedRef.current = false
    scoreRef.current = 0

    setSnake(newSnake)
    setFood(newFood)
    setDirection('right')
    setNextDirection('right')
    setScore(0)
    setGameOver(false)
    setPaused(false)

    // Reset API state
    setScoreResult(null)
    setScoreError('')
    setSubmittingScore(false)
  }, [])

  const changeDirection = useCallback((newDirection: Direction) => {
    if (gameOverRef.current) return

    const currentDirection = directionRef.current
    if (isOppositeDirection(currentDirection, newDirection)) {
      return
    }

    nextDirectionRef.current = newDirection
    setNextDirection(newDirection)
  }, [])

  const togglePause = useCallback(() => {
    if (gameOverRef.current) return

    const newPaused = !pausedRef.current
    pausedRef.current = newPaused
    setPaused(newPaused)
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Game Loop
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const gameSpeed = 120

    const interval = window.setInterval(() => {
      if (gameOverRef.current || pausedRef.current) {
        return
      }

      const newDir = nextDirectionRef.current
      directionRef.current = newDir
      setDirection(newDir)

      const currentSnake = snakeRef.current
      const currentFood = foodRef.current
      const head = currentSnake[0]
      const newHead = getNextHead(head, newDir)

      // 1. Wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= BOARD_SIZE ||
        newHead.y < 0 ||
        newHead.y >= BOARD_SIZE
      ) {
        triggerGameOver(scoreRef.current)
        return
      }

      // 2. Food collision check
      const ateFood = positionsEqual(newHead, currentFood)

      // 3. Body collision check
      const bodyToCheck = ateFood
        ? currentSnake
        : currentSnake.slice(0, currentSnake.length - 1)

      if (isSnakePosition(newHead, bodyToCheck)) {
        triggerGameOver(scoreRef.current)
        return
      }

      const newSnake = [newHead, ...currentSnake]

      if (ateFood) {
        const newScore = scoreRef.current + 10
        scoreRef.current = newScore
        setScore(newScore)

        playSound('hit')

        const newFood = createFood(newSnake)
        snakeRef.current = newSnake
        foodRef.current = newFood

        setSnake(newSnake)
        setFood(newFood)

        // If board filled completely
        if (newFood.x === -1 && newFood.y === -1) {
          triggerGameOver(newScore)
        }
      } else {
        newSnake.pop()
        snakeRef.current = newSnake
        setSnake(newSnake)
      }
    }, gameSpeed)

    return () => {
      window.clearInterval(interval)
    }
  }, [playSound, triggerGameOver])

  /*
  |--------------------------------------------------------------------------
  | Keyboard Controls
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (key === 'arrowup' || key === 'w') {
        event.preventDefault()
        changeDirection('up')
        return
      }
      if (key === 'arrowdown' || key === 's') {
        event.preventDefault()
        changeDirection('down')
        return
      }
      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault()
        changeDirection('left')
        return
      }
      if (key === 'arrowright' || key === 'd') {
        event.preventDefault()
        changeDirection('right')
        return
      }
      if (key === ' ') {
        event.preventDefault()
        togglePause()
        return
      }
      if (key === 'r') {
        event.preventDefault()
        resetGame()
        return
      }
      if (key === 'escape') {
        navigate('/')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [changeDirection, navigate, resetGame, togglePause])

  /*
  |--------------------------------------------------------------------------
  | Touch / Swipe Controls
  |--------------------------------------------------------------------------
  */
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y
    touchStart.current = null

    const minSwipeDistance = 30
    if (
      Math.abs(deltaX) < minSwipeDistance &&
      Math.abs(deltaY) < minSwipeDistance
    ) {
      return
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        changeDirection('right')
      } else {
        changeDirection('left')
      }
    } else {
      if (deltaY > 0) {
        changeDirection('down')
      } else {
        changeDirection('up')
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Mouse Drag Controls
  |--------------------------------------------------------------------------
  */
  const mouseStart = useRef<{ x: number; y: number } | null>(null)

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    mouseStart.current = {
      x: event.clientX,
      y: event.clientY,
    }
  }

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mouseStart.current) return

    const deltaX = event.clientX - mouseStart.current.x
    const deltaY = event.clientY - mouseStart.current.y
    mouseStart.current = null

    const minDragDistance = 35
    if (
      Math.abs(deltaX) < minDragDistance &&
      Math.abs(deltaY) < minDragDistance
    ) {
      return
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        changeDirection('right')
      } else {
        changeDirection('left')
      }
    } else {
      if (deltaY > 0) {
        changeDirection('down')
      } else {
        changeDirection('up')
      }
    }
  }

  const handleMouseLeave = () => {
    mouseStart.current = null
  }

  return (
    <main
      className="min-h-screen bg-[#08090D] px-4 py-6 text-white sm:px-5 sm:py-8"
      dir="rtl"
    >
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={18} />
            بازگشت
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-black sm:text-3xl">Snake</h1>
            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              تا جایی که می‌تونی رشد کن
            </p>
          </div>

          <button
            onClick={resetGame}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <RotateCcw size={18} />
            شروع مجدد
          </button>
        </header>

        {/* Score cards */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <div className="text-xs text-zinc-500">امتیاز فعلی</div>
            <div className="mt-1 text-2xl font-black">{score}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <div className="text-xs text-zinc-500">بهترین رکورد</div>
            <div className="mt-1 flex items-center justify-center gap-2 text-2xl font-black">
              <Trophy size={20} className="text-yellow-400" />
              {bestScore}
            </div>
          </div>
        </div>

        {/* Game Board Container */}
        <div
          dir="ltr"
          className="relative mx-auto w-full max-w-[520px] select-none overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] p-3 shadow-2xl"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="relative grid aspect-square w-full rounded-2xl bg-zinc-950/80"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
            }}
          >
            {/* Grid */}
            {Array.from({
              length: BOARD_SIZE * BOARD_SIZE,
            }).map((_, index) => (
              <div
                key={index}
                className="border border-white/[0.02]"
              />
            ))}

            {/* Food */}
            {food.x >= 0 && food.y >= 0 && (
              <div
                className="absolute rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]"
                style={{
                  width: `${100 / BOARD_SIZE}%`,
                  height: `${100 / BOARD_SIZE}%`,
                  left: `${(food.x * 100) / BOARD_SIZE}%`,
                  top: `${(food.y * 100) / BOARD_SIZE}%`,
                  transform: 'scale(0.65)',
                }}
              />
            )}

            {/* Snake */}
            {snake.map((segment, index) => (
              <div
                key={`${segment.x}-${segment.y}-${index}`}
                className={[
                  'absolute rounded-md transition-all duration-75',
                  index === 0
                    ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.45)]'
                    : 'bg-zinc-400',
                ].join(' ')}
                style={{
                  width: `${100 / BOARD_SIZE}%`,
                  height: `${100 / BOARD_SIZE}%`,
                  left: `${(segment.x * 100) / BOARD_SIZE}%`,
                  top: `${(segment.y * 100) / BOARD_SIZE}%`,
                  transform: index === 0 ? 'scale(0.92)' : 'scale(0.82)',
                }}
              >
                {/* Snake Eyes */}
                {index === 0 && (
                  <div className="relative h-full w-full">
                    {direction === 'right' && (
                      <>
                        <span className="absolute right-[18%] top-[22%] h-[15%] w-[15%] rounded-full bg-black" />
                        <span className="absolute bottom-[22%] right-[18%] h-[15%] w-[15%] rounded-full bg-black" />
                      </>
                    )}

                    {direction === 'left' && (
                      <>
                        <span className="absolute left-[18%] top-[22%] h-[15%] w-[15%] rounded-full bg-black" />
                        <span className="absolute bottom-[22%] left-[18%] h-[15%] w-[15%] rounded-full bg-black" />
                      </>
                    )}

                    {direction === 'up' && (
                      <>
                        <span className="absolute left-[22%] top-[18%] h-[15%] w-[15%] rounded-full bg-black" />
                        <span className="absolute right-[22%] top-[18%] h-[15%] w-[15%] rounded-full bg-black" />
                      </>
                    )}

                    {direction === 'down' && (
                      <>
                        <span className="absolute bottom-[18%] left-[22%] h-[15%] w-[15%] rounded-full bg-black" />
                        <span className="absolute bottom-[18%] right-[22%] h-[15%] w-[15%] rounded-full bg-black" />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pause overlay */}
          {paused && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm" dir="rtl">
              <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-[#0F1015] px-7 py-6 text-center shadow-2xl">
                <h2 className="text-xl font-bold">بازی متوقف شد</h2>
                <p className="mt-2 text-xs text-zinc-400">
                  برای ادامه کلید Space را فشار دهید
                </p>

                <button
                  onClick={togglePause}
                  className="mt-5 w-full rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-zinc-200"
                >
                  ادامه بازی
                </button>
              </div>
            </div>
          )}

          {/* Game Over Modal with Leaderboard */}
          {gameOver && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" dir="rtl">
              <div className="max-h-[95%] w-full max-w-sm overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0F1015] p-6 text-center shadow-2xl">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                  <Trophy size={32} className="text-yellow-400" />
                </div>

                <h2 className="text-2xl font-black">بازی تمام شد!</h2>
                <p className="mt-1 text-xs text-zinc-400">
                  مار به دیواره یا بدنش برخورد کرد.
                </p>

                {/* Score Summary */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-xs text-zinc-500">امتیاز نهایی</div>
                  <div className="mt-1 text-3xl font-black">{score}</div>
                </div>

                {/* Backend Submitting State */}
                {submittingScore && (
                  <p className="mt-4 text-xs text-zinc-500 animate-pulse">
                    در حال ثبت امتیاز در سرور...
                  </p>
                )}

                {/* Backend Error */}
                {scoreError && (
                  <p className="mt-4 text-xs text-red-400">{scoreError}</p>
                )}

                {/* New Record Announcement */}
                {!submittingScore &&
                  scoreResult &&
                  (scoreResult.is_new_record ||
                    (scoreResult.record > 0 &&
                      score >= scoreResult.record)) && (
                    <p className="mt-3 text-xs font-bold text-emerald-400">
                      🎉 رکورد جدید ثبت شد!
                    </p>
                  )}

                {/* Backend Results & Leaderboard */}
                {scoreResult && (
                  <div className="mt-4 space-y-3">
                    {/* Rank */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-xs text-zinc-500">رتبه شما در جدول</p>
                      <p className="mt-1 text-2xl font-black">
                        #{scoreResult.position}
                      </p>
                    </div>

                    {/* Leaderboard Slice */}
                    {scoreResult.players && scoreResult.players.length > 0 && (
                      <div className="overflow-hidden rounded-2xl border border-white/10">
                        <div className="border-b border-white/10 bg-white/[0.03] px-3 py-2 text-right">
                          <p className="text-[11px] font-bold text-zinc-400">
                            برترین بازیکنان
                          </p>
                        </div>

                        <div className="divide-y divide-white/5">
                          {scoreResult.players.map((player) => (
                            <div
                              key={player.id}
                              className={`flex items-center gap-2 px-3 py-2 text-xs ${
                                player.is_me ? 'bg-white/[0.08]' : ''
                              }`}
                            >
                              <div className="w-6 text-center font-bold text-zinc-500">
                                #{player.position}
                              </div>

                              <div className="min-w-0 flex-1 text-right">
                                <p
                                  className={`truncate font-bold ${
                                    player.is_me
                                      ? 'text-white'
                                      : 'text-zinc-300'
                                  }`}
                                >
                                  {player.username}
                                  {player.is_me && (
                                    <span className="mr-1 text-[10px] text-zinc-500">
                                      (شما)
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div className="font-black text-white">
                                {player.score}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={resetGame}
                    disabled={submittingScore}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    دوباره
                  </button>

                  <button
                    onClick={() => navigate('/')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    <Home size={16} />
                    خانه
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls Guide */}
        <div className="mx-auto mt-5 max-w-[520px] text-center">
          <p className="text-xs text-zinc-500">
            روی موبایل صفحه را به هر طرف بکشید
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            در کامپیوتر با ماوس بکشید یا از کلیدهای جهت‌دار / WASD استفاده کنید
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            برای توقف Space و برای شروع مجدد R را بزنید
          </p>
        </div>

        {/* Rules */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="mb-2 text-sm font-bold text-zinc-200">راهنمای بازی</h3>
          <ul className="list-inside list-disc space-y-1.5 text-xs leading-6 text-zinc-400">
            <li>غذاهای قرمز رنگ را جمع‌آوری کنید تا مار رشد کند.</li>
            <li>هر غذا ۱۰ امتیاز به حساب شما اضافه می‌کند.</li>
            <li>
              برخورد به لبه‌های دیوار یا به بدن خود مار باعث پایان بازی می‌شود.
            </li>
            <li>
              امتیاز شما پس از پایان بازی به صورت زنده در لیدربورد ثبت خواهد شد.
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}

export default Snake