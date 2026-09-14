import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Home,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Board = number[][]

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

const SIZE = 4
const DEVICE_TOKEN_KEY = 'reflex-games-device-token'
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

  const [row, col] = empty[Math.floor(Math.random() * empty.length)]
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
    if (i + 1 < values.length && values[i] === values[i + 1]) {
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
      if (col + 1 < SIZE && board[row][col] === board[row][col + 1]) {
        return true
      }
      if (row + 1 < SIZE && board[row][col] === board[row + 1][col]) {
        return true
      }
    }
  }
  return false
}

const getTileClasses = (value: number): string => {
  switch (value) {
    case 2:
      return 'bg-zinc-800 text-zinc-100 border border-white/10'
    case 4:
      return 'bg-zinc-700 text-white border border-white/15'
    case 8:
      return 'bg-amber-600 text-white shadow-[0_0_15px_rgba(217,119,6,0.3)]'
    case 16:
      return 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.35)]'
    case 32:
      return 'bg-orange-500 text-white shadow-[0_0_18px_rgba(249,115,22,0.4)]'
    case 64:
      return 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.45)]'
    case 128:
      return 'bg-yellow-500 text-black font-black shadow-[0_0_22px_rgba(234,179,8,0.5)]'
    case 256:
      return 'bg-yellow-400 text-black font-black shadow-[0_0_25px_rgba(250,204,21,0.6)]'
    case 512:
      return 'bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]'
    case 1024:
      return 'bg-cyan-500 text-black font-black shadow-[0_0_28px_rgba(6,182,212,0.6)]'
    case 2048:
      return 'bg-purple-600 text-white shadow-[0_0_35px_rgba(147,51,234,0.7)]'
    default:
      return 'bg-indigo-600 text-white shadow-[0_0_40px_rgba(79,70,229,0.8)]'
  }
}

const getFontSize = (value: number): string => {
  if (value >= 10000) return 'text-lg sm:text-xl'
  if (value >= 1000) return 'text-xl sm:text-2xl'
  if (value >= 100) return 'text-2xl sm:text-3xl'
  return 'text-3xl sm:text-4xl'
}

function Game2048() {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL

  const [board, setBoard] = useState<Board>(createInitialBoard)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState<number>(() => {
    const saved = localStorage.getItem(BEST_SCORE_KEY)
    return saved ? Number(saved) : 0
  })
  const [gameOver, setGameOver] = useState(false)

  // Backend API states
  const [submittingScore, setSubmittingScore] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [scoreError, setScoreError] = useState('')

  const gameOverRef = useRef(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const mouseStart = useRef<{ x: number; y: number } | null>(null)

  const hitSound = useRef<HTMLAudioElement | null>(null)
  const gameOverSound = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    hitSound.current = new Audio('/sounds/hit.wav')
    hitSound.current.volume = 0.2

    gameOverSound.current = new Audio('/sounds/gameover.wav')
    gameOverSound.current.volume = 0.45

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
            game: '2048',
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
            : 'خطایی هنگام ثبت امتیاز رخ داد.',
        )
      } finally {
        setSubmittingScore(false)
      }
    },
    [apiUrl],
  )

  const triggerGameOver = useCallback(
    (finalScore: number) => {
      if (gameOverRef.current) return
      gameOverRef.current = true

      setGameOver(true)
      playSound('gameover')
      submitScore(finalScore)
    },
    [playSound, submitScore],
  )

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard())
    setScore(0)
    setGameOver(false)
    gameOverRef.current = false

    // Reset API state
    setScoreResult(null)
    setScoreError('')
    setSubmittingScore(false)
  }, [])

  const handleMove = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameOverRef.current) return

      const result = moveBoard(board, direction)

      if (!result.moved) {
        if (!canMove(board)) {
          triggerGameOver(score)
        }
        return
      }

      const nextBoard = addRandomTile(result.board)
      const nextScore = score + result.gained

      setBoard(nextBoard)
      setScore(nextScore)
      playSound('hit')

      if (!canMove(nextBoard)) {
        triggerGameOver(nextScore)
      }
    },
    [board, playSound, score, triggerGameOver],
  )

  /*
   * Keyboard controls
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault()
        handleMove('left')
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault()
        handleMove('right')
      } else if (key === 'arrowup' || key === 'w') {
        event.preventDefault()
        handleMove('up')
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault()
        handleMove('down')
      } else if (key === 'escape') {
        navigate('/')
      } else if (key === 'r') {
        resetGame()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleMove, navigate, resetGame])

  /*
   * Touch swipe controls
   */
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
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
      if (deltaX > 0) handleMove('right')
      else handleMove('left')
    } else {
      if (deltaY > 0) handleMove('down')
      else handleMove('up')
    }
  }

  /*
   * Mouse drag controls
   */
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    mouseStart.current = { x: event.clientX, y: event.clientY }
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
      if (deltaX > 0) handleMove('right')
      else handleMove('left')
    } else {
      if (deltaY > 0) handleMove('down')
      else handleMove('up')
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
            <h1 className="text-2xl font-black sm:text-3xl">2048</h1>
            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              بیشترین امتیاز ممکن رو بساز
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

        {/* Score Cards */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <div className="text-xs text-zinc-500">امتیاز</div>
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
          className="relative mx-auto w-full max-w-[500px] cursor-grab select-none touch-none rounded-[2rem] border border-white/10 bg-white/[0.025] p-3.5 shadow-2xl active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {board.map((row, rowIndex) =>
              row.map((value, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="aspect-square rounded-2xl bg-white/[0.03] border border-white/[0.04] p-1"
                >
                  {value !== 0 && (
                    <div
                      className={[
                        'flex h-full w-full items-center justify-center rounded-xl font-black shadow-lg transition-transform duration-100',
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

          {/* Game Over Modal with Leaderboard */}
          {gameOver && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-black/85 p-4 backdrop-blur-md"
              dir="rtl"
            >
              <div className="max-h-[95%] w-full max-w-sm overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0F1015] p-6 text-center shadow-2xl">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <Trophy size={28} className="text-yellow-400" />
                </div>

                <h2 className="text-xl font-black">بازی تمام شد!</h2>
                <p className="mt-1 text-xs text-zinc-400">
                  دیگر هیچ حرکت ممکنی باقی نمانده است.
                </p>

                {/* Score Summary */}
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-[11px] text-zinc-500">امتیاز نهایی</div>
                  <div className="mt-1 text-3xl font-black">{score}</div>
                </div>

                {/* Submitting State */}
                {submittingScore && (
                  <p className="mt-4 text-xs text-zinc-500 animate-pulse">
                    در حال ثبت امتیاز در سرور...
                  </p>
                )}

                {/* Score Error */}
                {scoreError && (
                  <p className="mt-4 text-xs text-red-400">{scoreError}</p>
                )}

                {/* New Record Banner */}
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
                      <p className="text-[11px] text-zinc-500">رتبه شما در جدول</p>
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

        {/* Controls Info */}
        <div className="mx-auto mt-6 max-w-[500px] text-center">
          <p className="text-xs text-zinc-500">
            روی موبایل صفحه را به هر جهت بکشید
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            در کامپیوتر می‌توانید با ماوس بکشید یا از کلیدهای جهت‌دار / WASD
            استفاده کنید
          </p>
        </div>

        {/* Rules */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="mb-2 text-sm font-bold text-zinc-200">چطور بازی کنیم؟</h3>
          <div className="space-y-1.5 text-xs leading-6 text-zinc-400">
            <p>
              اعداد را با کشیدن صفحه به چهار جهت حرکت دهید. دو عدد یکسان در صورت برخورد با هم ترکیب می‌شوند.
            </p>
            <p>
              هدف ساخت کاشی‌های بزرگتر و دستیابی به بالاترین امتیاز ممکن است.
            </p>
            <p>
              امتیاز نهایی به طور خودکار در لیدربورد بازی‌ها ثبت خواهد شد.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Game2048