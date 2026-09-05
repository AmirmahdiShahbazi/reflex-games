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

const BOARD_SIZE = 20
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]

const BEST_SCORE_KEY = 'snake-best-score'

const createInitialSnake = (): Position[] =>
  INITIAL_SNAKE.map((segment) => ({ ...segment }))

const positionsEqual = (
  a: Position,
  b: Position,
): boolean => {
  return a.x === b.x && a.y === b.y
}

const isSnakePosition = (
  position: Position,
  snake: Position[],
): boolean => {
  return snake.some((segment) =>
    positionsEqual(segment, position),
  )
}

const createFood = (
  snake: Position[],
): Position => {
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

  return emptyCells[
    Math.floor(Math.random() * emptyCells.length)
  ]
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

const getNextHead = (
  head: Position,
  direction: Direction,
): Position => {
  switch (direction) {
    case 'up':
      return {
        x: head.x,
        y: head.y - 1,
      }

    case 'down':
      return {
        x: head.x,
        y: head.y + 1,
      }

    case 'left':
      return {
        x: head.x - 1,
        y: head.y,
      }

    case 'right':
      return {
        x: head.x + 1,
        y: head.y,
      }
  }
}

function Snake() {
  const navigate = useNavigate()

  const [snake, setSnake] = useState<Position[]>(
    createInitialSnake,
  )

  const [food, setFood] = useState<Position>(() =>
    createFood(createInitialSnake()),
  )

  const [direction, setDirection] =
    useState<Direction>('right')

  const [nextDirection, setNextDirection] =
    useState<Direction>('right')

  const [score, setScore] = useState(0)

  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem(
      BEST_SCORE_KEY,
    )

    return saved ? Number(saved) : 0
  })

  const [gameOver, setGameOver] = useState(false)

  const [paused, setPaused] = useState(false)

  const directionRef =
    useRef<Direction>('right')

  const nextDirectionRef =
    useRef<Direction>('right')

  const snakeRef = useRef<Position[]>(
    createInitialSnake(),
  )

  const foodRef = useRef<Position>(food)

  const gameOverRef = useRef(false)

  const pausedRef = useRef(false)

  const playSound = useCallback(
    (file: string, volume = 0.3) => {
      const audio = new Audio(file)

      audio.volume = volume

      audio.play().catch(() => {})
    },
    [],
  )

  const updateBestScore = useCallback(
    (newScore: number) => {
      if (newScore > bestScore) {
        setBestScore(newScore)

        localStorage.setItem(
          BEST_SCORE_KEY,
          String(newScore),
        )
      }
    },
    [bestScore],
  )

  const resetGame = useCallback(() => {
    const newSnake = createInitialSnake()

    const newFood = createFood(newSnake)

    snakeRef.current = newSnake

    foodRef.current = newFood

    directionRef.current = 'right'

    nextDirectionRef.current = 'right'

    gameOverRef.current = false

    pausedRef.current = false

    setSnake(newSnake)

    setFood(newFood)

    setDirection('right')

    setNextDirection('right')

    setScore(0)

    setGameOver(false)

    setPaused(false)
  }, [])

  const changeDirection = useCallback(
    (newDirection: Direction) => {
      if (gameOverRef.current) return

      const currentDirection =
        directionRef.current

      if (
        isOppositeDirection(
          currentDirection,
          newDirection,
        )
      ) {
        return
      }

      nextDirectionRef.current = newDirection

      setNextDirection(newDirection)
    },
    [],
  )

  const togglePause = useCallback(() => {
    if (gameOverRef.current) return

    const newPaused = !pausedRef.current

    pausedRef.current = newPaused

    setPaused(newPaused)
  }, [])

  /*
   * Game loop
   */
  useEffect(() => {
    const gameSpeed = 120

    const interval = window.setInterval(() => {
      if (
        gameOverRef.current ||
        pausedRef.current
      ) {
        return
      }

      const newDirection =
        nextDirectionRef.current

      directionRef.current = newDirection

      setDirection(newDirection)

      const currentSnake =
        snakeRef.current

      const currentFood =
        foodRef.current

      const head = currentSnake[0]

      const newHead = getNextHead(
        head,
        newDirection,
      )

      /*
       * Wall collision
       */
      if (
        newHead.x < 0 ||
        newHead.x >= BOARD_SIZE ||
        newHead.y < 0 ||
        newHead.y >= BOARD_SIZE
      ) {
        gameOverRef.current = true

        setGameOver(true)

        playSound(
          '/sounds/gameover.wav',
          0.4,
        )

        return
      }

      /*
       * Food collision
       */
      const ateFood = positionsEqual(
        newHead,
        currentFood,
      )

      /*
       * Body collision
       *
       * If we're not eating, the tail will move away,
       * so it doesn't count as a collision.
       */
      const bodyToCheck = ateFood
        ? currentSnake
        : currentSnake.slice(
            0,
            currentSnake.length - 1,
          )

      if (
        isSnakePosition(
          newHead,
          bodyToCheck,
        )
      ) {
        gameOverRef.current = true

        setGameOver(true)

        playSound(
          '/sounds/gameover.wav',
          0.4,
        )

        return
      }

      const newSnake = [
        newHead,
        ...currentSnake,
      ]

      if (ateFood) {
        const newScore =
          score + 10

        const newFood = createFood(
          newSnake,
        )

        snakeRef.current = newSnake

        foodRef.current = newFood

        setSnake(newSnake)

        setFood(newFood)

        setScore(newScore)

        updateBestScore(newScore)

        playSound(
          '/sounds/hit.wav',
          0.18,
        )

        /*
         * Board completely filled
         */
        if (
          newFood.x === -1 &&
          newFood.y === -1
        ) {
          gameOverRef.current = true

          setGameOver(true)
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
  }, [
    playSound,
    score,
    updateBestScore,
  ])

  /*
   * Keyboard controls
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const key = event.key.toLowerCase()

      if (
        key === 'arrowup' ||
        key === 'w'
      ) {
        event.preventDefault()

        changeDirection('up')

        return
      }

      if (
        key === 'arrowdown' ||
        key === 's'
      ) {
        event.preventDefault()

        changeDirection('down')

        return
      }

      if (
        key === 'arrowleft' ||
        key === 'a'
      ) {
        event.preventDefault()

        changeDirection('left')

        return
      }

      if (
        key === 'arrowright' ||
        key === 'd'
      ) {
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

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    changeDirection,
    navigate,
    resetGame,
    togglePause,
  ])

  /*
   * Touch controls
   */
  const touchStart = useRef<{
    x: number
    y: number
  } | null>(null)

  const handleTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    const touch = event.touches[0]

    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  const handleTouchEnd = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    if (!touchStart.current) return

    const touch = event.changedTouches[0]

    const deltaX =
      touch.clientX - touchStart.current.x

    const deltaY =
      touch.clientY - touchStart.current.y

    touchStart.current = null

    const minSwipeDistance = 30

    if (
      Math.abs(deltaX) < minSwipeDistance &&
      Math.abs(deltaY) < minSwipeDistance
    ) {
      return
    }

    /*
     * Physical screen coordinates.
     *
     * RTL does NOT affect clientX/clientY.
     */
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
   * Mouse controls
   */
  const mouseStart = useRef<{
    x: number
    y: number
  } | null>(null)

  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    mouseStart.current = {
      x: event.clientX,
      y: event.clientY,
    }
  }

  const handleMouseUp = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!mouseStart.current) return

    const deltaX =
      event.clientX - mouseStart.current.x

    const deltaY =
      event.clientY - mouseStart.current.y

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
    <div
      className="min-h-screen bg-slate-950 px-4 py-6 text-white"
      dir="rtl"
    >
      <div className="mx-auto w-full max-w-2xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            <ArrowLeft size={18} />

            بازگشت
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold">
              Snake
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              تا جایی که می‌تونی رشد کن
            </p>
          </div>

          <button
            onClick={resetGame}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            <RotateCcw size={18} />

            شروع مجدد
          </button>
        </div>

        {/* Score */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400">
              امتیاز
            </div>

            <div className="mt-1 text-2xl font-bold">
              {score}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400">
              بهترین
            </div>

            <div className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold">
              <Trophy size={20} />

              {bestScore}
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div
          dir="ltr"
          className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-2xl"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="relative grid aspect-square w-full"
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
                className="border border-slate-800/60"
              />
            ))}

            {/* Food */}
            {food.x >= 0 &&
              food.y >= 0 && (
                <div
                  className="absolute rounded-full bg-red-500 shadow-lg"
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
                  'absolute rounded-md',
                  index === 0
                    ? 'bg-white shadow-lg'
                    : 'bg-slate-300',
                ].join(' ')}
                style={{
                  width: `${100 / BOARD_SIZE}%`,
                  height: `${100 / BOARD_SIZE}%`,
                  left: `${(segment.x * 100) / BOARD_SIZE}%`,
                  top: `${(segment.y * 100) / BOARD_SIZE}%`,
                  transform:
                    index === 0
                      ? 'scale(0.9)'
                      : 'scale(0.82)',
                }}
              >
                {/* Snake eyes */}
                {index === 0 && (
                  <div className="relative h-full w-full">
                    {direction === 'right' && (
                      <>
                        <span className="absolute right-[18%] top-[22%] h-[15%] w-[15%] rounded-full bg-slate-900" />
                        <span className="absolute right-[18%] bottom-[22%] h-[15%] w-[15%] rounded-full bg-slate-900" />
                      </>
                    )}

                    {direction === 'left' && (
                      <>
                        <span className="absolute left-[18%] top-[22%] h-[15%] w-[15%] rounded-full bg-slate-900" />
                        <span className="absolute left-[18%] bottom-[22%] h-[15%] w-[15%] rounded-full bg-slate-900" />
                      </>
                    )}

                    {direction === 'up' && (
                      <>
                        <span className="absolute left-[22%] top-[18%] h-[15%] w-[15%] rounded-full bg-slate-900" />
                        <span className="absolute right-[22%] top-[18%] h-[15%] w-[15%] rounded-full bg-slate-900" />
                      </>
                    )}

                    {direction === 'down' && (
                      <>
                        <span className="absolute left-[22%] bottom-[18%] h-[15%] w-[15%] rounded-full bg-slate-900" />
                        <span className="absolute right-[22%] bottom-[18%] h-[15%] w-[15%] rounded-full bg-slate-900" />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pause overlay */}
          {paused && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm">
              <div className="rounded-2xl border border-slate-700 bg-slate-900 px-8 py-6 text-center shadow-2xl">
                <h2 className="text-2xl font-bold">
                  بازی متوقف شد
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  برای ادامه Space را بزن
                </p>

                <button
                  onClick={togglePause}
                  className="mt-5 rounded-xl bg-white px-5 py-2.5 font-medium text-slate-900 transition hover:bg-slate-200"
                >
                  ادامه بازی
                </button>
              </div>
            </div>
          )}

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
                <Trophy
                  size={44}
                  className="mx-auto mb-4"
                />

                <h2 className="text-2xl font-bold">
                  بازی تموم شد
                </h2>

                <p className="mt-2 text-slate-400">
                  مار به خودش یا دیواره برخورد کرد.
                </p>

                <div className="mt-5 rounded-xl bg-slate-800 p-4">
                  <div className="text-sm text-slate-400">
                    امتیاز نهایی
                  </div>

                  <div className="mt-1 text-3xl font-bold">
                    {score}
                  </div>
                </div>

                {score >= bestScore &&
                  score > 0 && (
                    <p className="mt-3 text-sm font-medium text-white">
                      رکورد جدید
                    </p>
                  )}

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={resetGame}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-medium text-slate-900 transition hover:bg-slate-200"
                  >
                    <RotateCcw size={18} />

                    دوباره
                  </button>

                  <button
                    onClick={() => navigate('/')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-medium transition hover:bg-slate-700"
                  >
                    <Home size={18} />

                    خانه
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mx-auto mt-6 max-w-[520px]">
          <p className="text-center text-sm text-slate-500">
            روی موبایل صفحه رو به هر طرف بکش
          </p>

          <p className="mt-1 text-center text-xs text-slate-600">
            در کامپیوتر با ماوس بکش یا از
            کلیدهای جهت‌دار و WASD استفاده کن
          </p>

          <p className="mt-1 text-center text-xs text-slate-600">
            برای توقف بازی Space و برای شروع مجدد R
            را بزن
          </p>
        </div>

        {/* Rules */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-3 font-bold">
            چطور بازی کنیم؟
          </h3>

          <div className="space-y-2 text-sm leading-7 text-slate-400">
            <p>
              مار را با کشیدن صفحه یا کلیدهای جهت‌دار
              حرکت بده.
            </p>

            <p>
              غذاهای قرمز را بخور تا مار بزرگ‌تر شود
              و امتیاز بگیری.
            </p>

            <p>
              اگر به دیواره یا بدن خودت برخورد کنی،
              بازی تمام می‌شود.
            </p>

            <p>
              هر غذا{' '}
              <strong className="text-white">
                ۱۰ امتیاز
              </strong>{' '}
              به تو می‌دهد.
            </p>

            <p>
              <strong className="text-white">
                هدف اینه که تا جای ممکن زنده بمونی و
                رکوردت رو بالا ببری.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Snake


