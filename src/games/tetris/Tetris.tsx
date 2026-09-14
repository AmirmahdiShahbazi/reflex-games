import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  RotateCw,
  Zap,
  Home,
  Pause,
  Play,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Cell = string | null
type Board = Cell[][]

type Point = {
  x: number
  y: number
}

type Piece = {
  type: TetrominoType
  rotation: number
  x: number
  y: number
}

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

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

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20

const BEST_SCORE_KEY = 'tetris-best-score'
const DEVICE_TOKEN_KEY = 'reflex-games-device-token'

const PIECES: Record<TetrominoType, Point[][]> = {
  I: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
  ],
  O: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  T: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  S: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  Z: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  J: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  L: [
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
}

const TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

/*
 * تم رنگی واقعی تتریس
 */
const TETRIS_THEMES: Record<TetrominoType, { fill: string; ghost: string }> = {
  I: {
    fill: 'bg-cyan-500 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]',
    ghost: 'border-cyan-500/50 bg-cyan-500/10',
  },
  O: {
    fill: 'bg-yellow-400 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.6)]',
    ghost: 'border-yellow-400/50 bg-yellow-400/10',
  },
  T: {
    fill: 'bg-purple-500 border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.6)]',
    ghost: 'border-purple-500/50 bg-purple-500/10',
  },
  S: {
    fill: 'bg-emerald-500 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
    ghost: 'border-emerald-500/50 bg-emerald-500/10',
  },
  Z: {
    fill: 'bg-red-500 border-red-300 shadow-[0_0_12px_rgba(239,68,68,0.6)]',
    ghost: 'border-red-500/50 bg-red-500/10',
  },
  J: {
    fill: 'bg-blue-500 border-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.6)]',
    ghost: 'border-blue-500/50 bg-blue-500/10',
  },
  L: {
    fill: 'bg-orange-500 border-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.6)]',
    ghost: 'border-orange-500/50 bg-orange-500/10',
  },
}

const createEmptyBoard = (): Board =>
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null))

const randomPieceType = (): TetrominoType => {
  return TYPES[Math.floor(Math.random() * TYPES.length)]
}

const createPiece = (type: TetrominoType = randomPieceType()): Piece => ({
  type,
  rotation: 0,
  x: 3,
  y: 0,
})

const rotatePoints = (points: Point[], rotation: number): Point[] => {
  if (rotation === 0) {
    return points.map((point) => ({ ...point }))
  }

  return points.map((point) => {
    const x = point.x
    const y = point.y

    if (rotation === 1) return { x: 2 - y, y: x }
    if (rotation === 2) return { x: 2 - x, y: 2 - y }
    return { x: y, y: 2 - x }
  })
}

const getPieceCells = (piece: Piece): Point[] => {
  const points = rotatePoints(PIECES[piece.type], piece.rotation)
  return points.map((point) => ({
    x: point.x + piece.x,
    y: point.y + piece.y,
  }))
}

const canPlacePiece = (board: Board, piece: Piece): boolean => {
  const cells = getPieceCells(piece)
  for (const cell of cells) {
    if (cell.x < 0 || cell.x >= BOARD_WIDTH || cell.y >= BOARD_HEIGHT) {
      return false
    }
    if (cell.y >= 0 && board[cell.y][cell.x] !== null) {
      return false
    }
  }
  return true
}

const mergePiece = (board: Board, piece: Piece): Board => {
  const nextBoard = board.map((row) => [...row])
  for (const cell of getPieceCells(piece)) {
    if (
      cell.y >= 0 &&
      cell.y < BOARD_HEIGHT &&
      cell.x >= 0 &&
      cell.x < BOARD_WIDTH
    ) {
      nextBoard[cell.y][cell.x] = piece.type
    }
  }
  return nextBoard
}

const clearLines = (
  board: Board,
): {
  board: Board
  lines: number
} => {
  const remainingRows = board.filter((row) =>
    row.some((cell) => cell === null),
  )
  const lines = BOARD_HEIGHT - remainingRows.length
  const emptyRows = Array.from({ length: lines }, () =>
    Array<Cell>(BOARD_WIDTH).fill(null),
  )

  return {
    board: [...emptyRows, ...remainingRows],
    lines,
  }
}

const getLineScore = (lines: number, level: number): number => {
  if (lines === 1) return 100 * level
  if (lines === 2) return 300 * level
  if (lines === 3) return 500 * level
  if (lines === 4) return 800 * level
  return 0
}

const getFallDelay = (level: number): number => {
  return Math.max(80, 800 - (level - 1) * 65)
}

const getGhostPiece = (board: Board, piece: Piece): Piece => {
  let ghost = { ...piece }
  while (
    canPlacePiece(board, {
      ...ghost,
      y: ghost.y + 1,
    })
  ) {
    ghost = { ...ghost, y: ghost.y + 1 }
  }
  return ghost
}

function Tetris() {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL

  const [board, setBoard] = useState<Board>(createEmptyBoard)
  const [currentPiece, setCurrentPiece] = useState<Piece>(() => createPiece())
  const [nextPiece, setNextPiece] = useState<Piece>(() => createPiece())

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [combo, setCombo] = useState(-1)

  const [bestScore, setBestScore] = useState<number>(() => {
    return Number(localStorage.getItem(BEST_SCORE_KEY) || 0)
  })

  const [isPaused, setIsPaused] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)

  // Backend States
  const [submittingScore, setSubmittingScore] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [scoreError, setScoreError] = useState('')

  const dropTimerRef = useRef<number | null>(null)
  const scoreRef = useRef(0)
  const linesRef = useRef(0)
  const levelRef = useRef(1)
  const comboRef = useRef(-1)
  const gameOverRef = useRef(false)

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
   * ارسال امتیاز به بک‌اند
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
            game: 'tetris',
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

  const finishGame = useCallback(() => {
    if (gameOverRef.current) return
    gameOverRef.current = true

    setIsGameOver(true)
    setIsPaused(false)
    playSound('gameover')
    submitScore(scoreRef.current)
  }, [playSound, submitScore])

  /*
   * ریست کامل بازی - رفع قطعی مشکل گیر کردن مهره
   */
  const resetGame = useCallback(() => {
    if (dropTimerRef.current !== null) {
      clearInterval(dropTimerRef.current)
      dropTimerRef.current = null
    }

    setBoard(createEmptyBoard())
    setCurrentPiece(createPiece())
    setNextPiece(createPiece())

    setScore(0)
    setLines(0)
    setLevel(1)
    setCombo(-1)

    scoreRef.current = 0
    linesRef.current = 0
    levelRef.current = 1
    comboRef.current = -1

    setIsPaused(false)
    setIsGameOver(false)
    gameOverRef.current = false

    setScoreResult(null)
    setScoreError('')
    setSubmittingScore(false)
  }, [])

  const spawnNextPiece = useCallback(
    (updatedBoard: Board, upcoming: Piece) => {
      const newPiece = createPiece(upcoming.type)
      const followingPiece = createPiece()

      if (!canPlacePiece(updatedBoard, newPiece)) {
        finishGame()
        return
      }

      setCurrentPiece(newPiece)
      setNextPiece(followingPiece)
    },
    [finishGame],
  )

  const lockPiece = useCallback(
    (piece: Piece) => {
      const mergedBoard = mergePiece(board, piece)
      const result = clearLines(mergedBoard)

      setBoard(result.board)

      if (result.lines > 0) {
        playSound('hit')
        const currentLevel = levelRef.current
        const basePoints = getLineScore(result.lines, currentLevel)
        const previousCombo = comboRef.current
        const newCombo = previousCombo + 1
        const comboBonus = newCombo > 0 ? newCombo * 50 * currentLevel : 0
        const totalPoints = basePoints + comboBonus

        const newScore = scoreRef.current + totalPoints
        scoreRef.current = newScore
        setScore(newScore)

        comboRef.current = newCombo
        setCombo(newCombo)

        const newLines = linesRef.current + result.lines
        linesRef.current = newLines
        setLines(newLines)

        const newLevel = Math.floor(newLines / 10) + 1
        levelRef.current = newLevel
        setLevel(newLevel)
      } else {
        comboRef.current = -1
        setCombo(-1)
      }

      spawnNextPiece(result.board, nextPiece)
    },
    [board, nextPiece, playSound, spawnNextPiece],
  )

  const movePiece = useCallback(
    (dx: number, dy: number): boolean => {
      if (isPaused || isGameOver || gameOverRef.current) return false

      const movedPiece: Piece = {
        ...currentPiece,
        x: currentPiece.x + dx,
        y: currentPiece.y + dy,
      }

      if (canPlacePiece(board, movedPiece)) {
        setCurrentPiece(movedPiece)
        return true
      }

      return false
    },
    [board, currentPiece, isPaused, isGameOver],
  )

  const softDrop = useCallback(() => {
    if (isPaused || isGameOver || gameOverRef.current) return

    const moved = movePiece(0, 1)
    if (moved) {
      scoreRef.current += 1
      setScore(scoreRef.current)
    } else {
      lockPiece(currentPiece)
    }
  }, [movePiece, lockPiece, currentPiece, isPaused, isGameOver])

  const hardDrop = useCallback(() => {
    if (isPaused || isGameOver || gameOverRef.current) return

    let distance = 0
    let droppedPiece = { ...currentPiece }

    while (
      canPlacePiece(board, {
        ...droppedPiece,
        y: droppedPiece.y + 1,
      })
    ) {
      droppedPiece = {
        ...droppedPiece,
        y: droppedPiece.y + 1,
      }
      distance++
    }

    scoreRef.current += distance * 2
    setScore(scoreRef.current)
    setCurrentPiece(droppedPiece)
    lockPiece(droppedPiece)
  }, [board, currentPiece, isPaused, isGameOver, lockPiece])

  const rotatePiece = useCallback(() => {
    if (isPaused || isGameOver || gameOverRef.current) return

    const nextRotation = (currentPiece.rotation + 1) % 4
    const rotatedPiece: Piece = {
      ...currentPiece,
      rotation: nextRotation,
    }

    if (canPlacePiece(board, rotatedPiece)) {
      setCurrentPiece(rotatedPiece)
      return
    }

    const kicks = [-1, 1, -2, 2]
    for (const kick of kicks) {
      const kickedPiece: Piece = {
        ...rotatedPiece,
        x: rotatedPiece.x + kick,
      }

      if (canPlacePiece(board, kickedPiece)) {
        setCurrentPiece(kickedPiece)
        return
      }
    }
  }, [board, currentPiece, isPaused, isGameOver])

  const moveLeft = useCallback(() => movePiece(-1, 0), [movePiece])
  const moveRight = useCallback(() => movePiece(1, 0), [movePiece])

  /*
   * تایمر جاذبه و سقوط پیوسته
   */
  useEffect(() => {
    if (isPaused || isGameOver) return

    dropTimerRef.current = window.setInterval(() => {
      setCurrentPiece((piece) => {
        const movedPiece = { ...piece, y: piece.y + 1 }

        if (canPlacePiece(board, movedPiece)) {
          return movedPiece
        }

        lockPiece(piece)
        return piece
      })
    }, getFallDelay(level))

    return () => {
      if (dropTimerRef.current !== null) {
        clearInterval(dropTimerRef.current)
        dropTimerRef.current = null
      }
    }
  }, [board, level, isPaused, isGameOver, lockPiece])

  /*
   * کیبورد دسکتاپ
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        if (!isGameOver) {
          setIsPaused((prev) => !prev)
        }
        return
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        resetGame()
        return
      }

      if (isPaused || isGameOver) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          moveLeft()
          break
        case 'ArrowRight':
          event.preventDefault()
          moveRight()
          break
        case 'ArrowDown':
          event.preventDefault()
          softDrop()
          break
        case 'ArrowUp':
        case 'z':
        case 'Z':
        case 'x':
        case 'X':
          event.preventDefault()
          rotatePiece()
          break
        case 'Enter':
          event.preventDefault()
          hardDrop()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isPaused,
    isGameOver,
    moveLeft,
    moveRight,
    softDrop,
    rotatePiece,
    hardDrop,
    resetGame,
  ])

  const ghostPiece = useMemo(
    () => getGhostPiece(board, currentPiece),
    [board, currentPiece],
  )

  const displayBoard = useMemo(() => {
    const result = board.map((row) => [...row])

    for (const cell of getPieceCells(ghostPiece)) {
      if (
        cell.y >= 0 &&
        cell.y < BOARD_HEIGHT &&
        cell.x >= 0 &&
        cell.x < BOARD_WIDTH &&
        result[cell.y][cell.x] === null
      ) {
        result[cell.y][cell.x] = `ghost-${currentPiece.type}`
      }
    }

    for (const cell of getPieceCells(currentPiece)) {
      if (
        cell.y >= 0 &&
        cell.y < BOARD_HEIGHT &&
        cell.x >= 0 &&
        cell.x < BOARD_WIDTH
      ) {
        result[cell.y][cell.x] = currentPiece.type
      }
    }

    return result
  }, [board, currentPiece, ghostPiece])

  const nextPreview = useMemo(() => {
    const preview = Array.from({ length: 4 }, () =>
      Array<Cell>(4).fill(null),
    )
    const piece = createPiece(nextPiece.type)
    piece.x = 0
    piece.y = 0

    for (const cell of getPieceCells(piece)) {
      if (cell.x >= 0 && cell.x < 4 && cell.y >= 0 && cell.y < 4) {
        preview[cell.y][cell.x] = nextPiece.type
      }
    }

    return preview
  }, [nextPiece])

  const getCellClass = (value: Cell): string => {
    if (!value) return 'bg-white/[0.015]'

    if (value.startsWith('ghost-')) {
      const type = value.replace('ghost-', '') as TetrominoType
      const theme = TETRIS_THEMES[type]
      return theme ? theme.ghost : 'border-white/20 bg-white/5'
    }

    const theme = TETRIS_THEMES[value as TetrominoType]
    return theme
      ? `${theme.fill} rounded-[3px]`
      : 'bg-white/20 border-white/30'
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#08090D] text-white">
      <div className="mx-auto min-h-screen max-w-5xl px-3 py-4 sm:px-5 sm:py-6">

        {/* Header */}
        <header className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft size={16} />
            بازگشت
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
            <Trophy size={16} className="text-yellow-400" />
            <div className="text-right">
              <div className="text-[9px] text-white/40">بهترین رکورد</div>
              <div className="text-xs font-black">{bestScore}</div>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="mx-auto mb-3 grid max-w-[480px] grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 text-center">
            <div className="text-[10px] text-white/40">امتیاز</div>
            <div className="font-mono text-base font-black sm:text-lg">
              {score.toLocaleString('en-US')}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 text-center">
            <div className="text-[10px] text-white/40">سطح</div>
            <div className="font-mono text-base font-black sm:text-lg">{level}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 text-center">
            <div className="text-[10px] text-white/40">خطوط</div>
            <div className="font-mono text-base font-black sm:text-lg">{lines}</div>
          </div>
        </section>

        {/* Main Board Area */}
        <section className="mx-auto flex max-w-[560px] flex-col items-center justify-center gap-3 sm:flex-row sm:items-start">
          {/* Tetris Board */}
          <div
            dir="ltr"
            className="relative w-[min(80vw,290px)] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#0B0D12] p-2 shadow-2xl"
          >
            <div className="grid aspect-[1/2] w-full grid-cols-10 overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {displayBoard.map((row, rowIndex) =>
                row.map((value, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`border border-white/[0.03] transition-colors duration-75 ${getCellClass(
                      value,
                    )}`}
                  />
                )),
              )}
            </div>

            {/* Pause Overlay */}
            {isPaused && !isGameOver && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/85 backdrop-blur-sm"
                dir="rtl"
              >
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Pause size={22} />
                  </div>
                  <h3 className="text-base font-bold">بازی متوقف است</h3>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-xs font-bold text-black"
                  >
                    <Play size={14} />
                    ادامه
                  </button>
                </div>
              </div>
            )}

            {/* Game Over Leaderboard Modal */}
            {isGameOver && (
              <div
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
                dir="rtl"
              >
                <div className="max-h-[92vh] w-full max-w-xs overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0F1015] p-5 text-center shadow-2xl">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Trophy size={24} className="text-yellow-400" />
                  </div>

                  <h2 className="text-lg font-black">بازی تمام شد!</h2>
                  <div className="mt-1 text-2xl font-black">{score}</div>
                  <p className="text-[11px] text-white/40">{lines} خط پاک شد</p>

                  {submittingScore && (
                    <p className="mt-2 text-xs text-zinc-500 animate-pulse">
                      در حال ثبت امتیاز...
                    </p>
                  )}

                  {scoreError && (
                    <p className="mt-2 text-xs text-red-400">{scoreError}</p>
                  )}

                  {!submittingScore &&
                    scoreResult &&
                    (scoreResult.is_new_record ||
                      (scoreResult.record > 0 &&
                        score >= scoreResult.record)) && (
                      <p className="mt-2 text-xs font-bold text-emerald-400">
                        🎉 رکورد جدید!
                      </p>
                    )}

                  {scoreResult && (
                    <div className="mt-3 space-y-2 text-right">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
                        <p className="text-[10px] text-zinc-500">رتبه شما</p>
                        <p className="text-lg font-black">
                          #{scoreResult.position}
                        </p>
                      </div>

                      {scoreResult.players && scoreResult.players.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-white/10">
                          <div className="border-b border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold text-zinc-400">
                            برترین بازیکنان
                          </div>
                          <div className="divide-y divide-white/5 text-xs">
                            {scoreResult.players.map((player) => (
                              <div
                                key={player.id}
                                className={`flex items-center gap-2 px-2.5 py-1.5 ${
                                  player.is_me ? 'bg-white/[0.08]' : ''
                                }`}
                              >
                                <div className="w-4 font-bold text-zinc-500">
                                  #{player.position}
                                </div>
                                <div className="min-w-0 flex-1 truncate font-medium">
                                  {player.username}
                                  {player.is_me && (
                                    <span className="mr-1 text-[9px] text-zinc-400">
                                      (شما)
                                    </span>
                                  )}
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

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={resetGame}
                      disabled={submittingScore}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-black"
                    >
                      <RotateCcw size={14} />
                      دوباره
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white"
                    >
                      <Home size={14} />
                      خانه
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Piece Box */}
          <div className="flex w-full max-w-[290px] items-center justify-between sm:w-[130px] sm:flex-col sm:justify-start">
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
              <div className="mb-2 text-[10px] text-white/40">مهره بعدی</div>
              <div
                dir="ltr"
                className="mx-auto grid h-[76px] w-[76px] grid-cols-4 grid-rows-4 overflow-hidden rounded-xl border border-white/10 bg-black/50 p-1"
              >
                {nextPreview.map((row, rowIndex) =>
                  row.map((value, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`border border-white/[0.02] ${
                        value
                          ? TETRIS_THEMES[value as TetrominoType]?.fill
                          : ''
                      }`}
                    />
                  )),
                )}
              </div>
            </div>

            {combo > 0 && (
              <div className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-center">
                <div className="text-[10px] text-white/40">کمبو</div>
                <div className="text-base font-black text-amber-400">
                  ×{combo + 1}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 🎮 گیم‌پد اختصاصی موبایل (طراحی ارگونومیک و همیشه فعال) */}
        <section
          dir="ltr"
          className="mx-auto mt-4 w-full max-w-[340px] select-none touch-none"
        >
          <div className="grid grid-cols-5 gap-2">
            {/* حرکت به چپ */}
            <button
              onClick={moveLeft}
              disabled={isPaused || isGameOver}
              className="flex h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] text-white shadow-lg active:scale-90 active:bg-white/20 disabled:opacity-30"
              aria-label="چپ"
            >
              <ArrowLeftIcon size={24} />
            </button>

            {/* سقوط آرام */}
            <button
              onClick={softDrop}
              disabled={isPaused || isGameOver}
              className="flex h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] text-white shadow-lg active:scale-90 active:bg-white/20 disabled:opacity-30"
              aria-label="پایین"
            >
              <ArrowDown size={24} />
            </button>

            {/* حرکت به راست */}
            <button
              onClick={moveRight}
              disabled={isPaused || isGameOver}
              className="flex h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] text-white shadow-lg active:scale-90 active:bg-white/20 disabled:opacity-30"
              aria-label="راست"
            >
              <ArrowRightIcon size={24} />
            </button>

            {/* چرخش مهره */}
            <button
              onClick={rotatePiece}
              disabled={isPaused || isGameOver}
              className="flex h-14 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-500/15 text-cyan-400 shadow-lg active:scale-90 active:bg-cyan-500/30 disabled:opacity-30"
              aria-label="چرخش"
            >
              <RotateCw size={24} />
            </button>

            {/* سقوط آنی (هارد دراپ) */}
            <button
              onClick={hardDrop}
              disabled={isPaused || isGameOver}
              className="flex h-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-lg active:scale-90 active:bg-amber-500/30 disabled:opacity-30"
              aria-label="سقوط کامل"
            >
              <Zap size={24} />
            </button>
          </div>
        </section>

        {/* Action Controls */}
        <section className="mx-auto mt-4 flex max-w-[340px] justify-center gap-2">
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            disabled={isGameOver}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-bold text-white/80 active:scale-95 disabled:opacity-30"
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'ادامه' : 'توقف'}
          </button>

          <button
            onClick={resetGame}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-bold text-white/80 active:scale-95"
          >
            <RotateCcw size={14} />
            شروع مجدد
          </button>
        </section>

      </div>
    </main>
  )
}

export default Tetris