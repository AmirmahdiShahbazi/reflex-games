import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Home,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Board = number[][]

const SIZE = 4
const BEST_SCORE_KEY = '2048-best-score'

const createEmptyBoard = (): Board =>
  Array.from({ length: SIZE }, () => Array(SIZE).fill(0))

const addRandomTile = (board: Board): Board => {
  const empty: Array<[number, number]> = []

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === 0) {
        empty.push([row, col])
      }
    }
  }

  if (empty.length === 0) {
    return board
  }

  const [row, col] =
    empty[Math.floor(Math.random() * empty.length)]

  const newBoard = board.map((r) => [...r])

  newBoard[row][col] = Math.random() < 0.9 ? 2 : 4

  return newBoard
}

const createInitialBoard = (): Board => {
  let board = createEmptyBoard()

  board = addRandomTile(board)
  board = addRandomTile(board)

  return board
}

const boardsEqual = (a: Board, b: Board): boolean => {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (a[row][col] !== b[row][col]) {
        return false
      }
    }
  }

  return true
}

const slideRow = (
  row: number[],
): {
  row: number[]
  gained: number
} => {
  const values = row.filter((value) => value !== 0)

  const result: number[] = []

  let gained = 0

  for (let i = 0; i < values.length; i++) {
    if (
      i + 1 < values.length &&
      values[i] === values[i + 1]
    ) {
      const merged = values[i] * 2

      result.push(merged)

      gained += merged

      i++
    } else {
      result.push(values[i])
    }
  }

  while (result.length < SIZE) {
    result.push(0)
  }

  return {
    row: result,
    gained,
  }
}

const moveBoard = (
  board: Board,
  direction: 'left' | 'right' | 'up' | 'down',
): {
  board: Board
  gained: number
  moved: boolean
} => {
  const working = board.map((row) => [...row])

  let gained = 0

  if (direction === 'left') {
    for (let row = 0; row < SIZE; row++) {
      const result = slideRow(working[row])

      working[row] = result.row

      gained += result.gained
    }
  }

  if (direction === 'right') {
    for (let row = 0; row < SIZE; row++) {
      const reversed = [...working[row]].reverse()

      const result = slideRow(reversed)

      working[row] = [...result.row].reverse()

      gained += result.gained
    }
  }

  if (direction === 'up') {
    for (let col = 0; col < SIZE; col++) {
      const column: number[] = []

      for (let row = 0; row < SIZE; row++) {
        column.push(working[row][col])
      }

      const result = slideRow(column)

      for (let row = 0; row < SIZE; row++) {
        working[row][col] = result.row[row]
      }

      gained += result.gained
    }
  }

  if (direction === 'down') {
    for (let col = 0; col < SIZE; col++) {
      const column: number[] = []

      for (let row = 0; row < SIZE; row++) {
        column.push(working[row][col])
      }

      const result = slideRow([...column].reverse())

      const reversed = [...result.row].reverse()

      for (let row = 0; row < SIZE; row++) {
        working[row][col] = reversed[row]
      }

      gained += result.gained
    }
  }

  return {
    board: working,
    gained,
    moved: !boardsEqual(board, working),
  }
}

const canMove = (board: Board): boolean => {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === 0) {
        return true
      }

      if (
        col + 1 < SIZE &&
        board[row][col] === board[row][col + 1]
      ) {
        return true
      }

      if (
        row + 1 < SIZE &&
        board[row][col] === board[row + 1][col]
      ) {
        return true
      }
    }
  }

  return false
}

const getTileClasses = (value: number): string => {
  switch (value) {
    case 2:
      return 'bg-slate-100 text-slate-800'

    case 4:
      return 'bg-slate-200 text-slate-800'

    case 8:
      return 'bg-orange-300 text-white'

    case 16:
      return 'bg-orange-400 text-white'

    case 32:
      return 'bg-orange-500 text-white'

    case 64:
      return 'bg-red-500 text-white'

    case 128:
      return 'bg-yellow-400 text-white'

    case 256:
      return 'bg-yellow-500 text-white'

    case 512:
      return 'bg-yellow-600 text-white'

    case 1024:
      return 'bg-purple-500 text-white'

    case 2048:
      return 'bg-purple-700 text-white'

    default:
      return 'bg-slate-700 text-white'
  }
}

const getFontSize = (value: number): string => {
  if (value >= 10000) return 'text-xl'

  if (value >= 1000) return 'text-2xl'

  if (value >= 100) return 'text-3xl'

  return 'text-4xl'
}

function Game2048() {
  const navigate = useNavigate()

  const [board, setBoard] = useState<Board>(createInitialBoard)

  const [score, setScore] = useState(0)

  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem(BEST_SCORE_KEY)

    return saved ? Number(saved) : 0
  })

  const [gameOver, setGameOver] = useState(false)

  const touchStart = useRef<{
    x: number
    y: number
  } | null>(null)

  const mouseStart = useRef<{
    x: number
    y: number
  } | null>(null)

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
    setBoard(createInitialBoard())

    setScore(0)

    setGameOver(false)
  }, [])

  const handleMove = useCallback(
    (
      direction:
        | 'left'
        | 'right'
        | 'up'
        | 'down',
    ) => {
      if (gameOver) return

      const result = moveBoard(board, direction)

      if (!result.moved) {
        if (!canMove(board)) {
          setGameOver(true)

          playSound(
            '/sounds/gameover.wav',
            0.4,
          )
        }

        return
      }

      const nextBoard = addRandomTile(
        result.board,
      )

      const nextScore =
        score + result.gained

      setBoard(nextBoard)

      setScore(nextScore)

      updateBestScore(nextScore)

      playSound(
        '/sounds/hit.wav',
        0.18,
      )

      if (!canMove(nextBoard)) {
        setGameOver(true)

        playSound(
          '/sounds/gameover.wav',
          0.4,
        )
      }
    },
    [
      board,
      gameOver,
      playSound,
      score,
      updateBestScore,
    ],
  )

  /*
   * Keyboard controls
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const key = event.key.toLowerCase()

      if (
        key === 'arrowleft' ||
        key === 'a'
      ) {
        event.preventDefault()

        handleMove('left')
      }

      if (
        key === 'arrowright' ||
        key === 'd'
      ) {
        event.preventDefault()

        handleMove('right')
      }

      if (
        key === 'arrowup' ||
        key === 'w'
      ) {
        event.preventDefault()

        handleMove('up')
      }

      if (
        key === 'arrowdown' ||
        key === 's'
      ) {
        event.preventDefault()

        handleMove('down')
      }

      if (key === 'escape') {
        navigate('/')
      }

      if (key === 'r') {
        resetGame()
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
    handleMove,
    navigate,
    resetGame,
  ])

  /*
   * Mobile touch swipe
   *
   * IMPORTANT:
   * clientX/clientY are physical screen coordinates.
   * RTL does NOT reverse these coordinates.
   *
   * Therefore:
   * deltaX > 0 = swipe RIGHT
   * deltaX < 0 = swipe LEFT
   */
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

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Physical swipe right = game moves right
      if (deltaX > 0) {
        handleMove('right')
      } else {
        handleMove('left')
      }
    } else {
      // Physical swipe down = game moves down
      if (deltaY > 0) {
        handleMove('down')
      } else {
        handleMove('up')
      }
    }
  }

  /*
   * Desktop mouse drag
   */
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
      // Physical drag right = game moves right
      if (deltaX > 0) {
        handleMove('right')
      } else {
        handleMove('left')
      }
    } else {
      // Physical drag down = game moves down
      if (deltaY > 0) {
        handleMove('down')
      } else {
        handleMove('up')
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
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft size={18} />

            بازگشت
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold">
              2048
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              بیشترین امتیاز ممکن رو بگیر
            </p>
          </div>

          <button
            onClick={resetGame}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
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

        {/* Game board */}
            <div
            dir="ltr"
            className="relative mx-auto w-full max-w-[520px] cursor-grab touch-none select-none rounded-2xl bg-slate-800 p-3 shadow-2xl active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            >
          <div className="grid grid-cols-4 gap-3">
            {board.map((row, rowIndex) =>
              row.map((value, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="aspect-square rounded-xl bg-slate-700"
                >
                  {value !== 0 && (
                    <div
                      className={[
                        'flex h-full w-full items-center justify-center rounded-xl font-bold shadow-lg',
                        'transition-all duration-100',
                        getTileClasses(value),
                        getFontSize(value),
                      ].join(' ')}
                    >
                      {value}
                    </div>
                  )}
                </div>
              )),
            )}
          </div>

          {/* Game over overlay */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/80 p-6 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
                <Trophy
                  size={44}
                  className="mx-auto mb-4"
                />

                <h2 className="text-2xl font-bold">
                  بازی تموم شد
                </h2>

                <p className="mt-2 text-slate-400">
                  دیگه هیچ حرکت ممکنی باقی نمونده.
                </p>

                <div className="mt-5 rounded-xl bg-slate-800 p-4">
                  <div className="text-sm text-slate-400">
                    امتیاز نهایی
                  </div>

                  <div className="mt-1 text-3xl font-bold">
                    {score}
                  </div>
                </div>

                {score >= bestScore && score > 0 && (
                  <p className="mt-3 text-sm font-medium text-white">
                    رکورد جدید
                  </p>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={resetGame}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-medium text-slate-900 hover:bg-slate-200"
                  >
                    <RotateCcw size={18} />

                    دوباره
                  </button>

                  <button
                    onClick={() => navigate('/')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-medium hover:bg-slate-700"
                  >
                    <Home size={18} />

                    خانه
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls information */}
        <div className="mx-auto mt-6 max-w-[520px]">
          <p className="text-center text-sm text-slate-500">
            روی موبایل صفحه رو به هر طرف بکش
          </p>

          <p className="mt-1 text-center text-xs text-slate-600">
            در کامپیوتر می‌تونی با ماوس بکشید یا از
            کلیدهای جهت‌دار و WASD استفاده کنی
          </p>
        </div>

        {/* Rules */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-3 font-bold">
            چطور بازی کنیم؟
          </h3>

          <div className="space-y-2 text-sm leading-7 text-slate-400">
            <p>
              عددها رو با کشیدن صفحه به چپ، راست،
              بالا یا پایین حرکت بده.
            </p>

            <p>
              دو عدد یکسان وقتی به هم برسن با هم
              ترکیب می‌شن.
            </p>

            <p>
              هر ترکیب به اندازه عدد جدید به
              امتیازت اضافه می‌کنه.
            </p>

            <p>
              بعد از هر حرکت یک عدد جدید روی صفحه
              ظاهر می‌شه.
            </p>

            <p>
              <strong className="text-white">
                هدف فقط گرفتن بیشترین امتیاز ممکنه.
              </strong>
            </p>

            <p>
              ساختن ۲۰۴۸ پایان بازی نیست؛ می‌تونی
              بعد از اون هم به بازی ادامه بدی و
              رکوردت رو بالاتر ببری.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Game2048