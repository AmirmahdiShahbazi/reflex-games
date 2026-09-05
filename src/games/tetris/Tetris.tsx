import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20

const BEST_SCORE_KEY = 'tetris-best-score'

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

const TYPES: TetrominoType[] = [
  'I',
  'O',
  'T',
  'S',
  'Z',
  'J',
  'L',
]

const createEmptyBoard = (): Board =>
  Array.from(
    { length: BOARD_HEIGHT },
    () => Array(BOARD_WIDTH).fill(null)
  )

const getBestScore = (): number => {
  try {
    const value = localStorage.getItem(BEST_SCORE_KEY)

    if (!value) return 0

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

const saveBestScore = (score: number) => {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score))
  } catch {
    // Ignore localStorage errors.
  }
}

const randomPieceType = (): TetrominoType => {
  return TYPES[Math.floor(Math.random() * TYPES.length)]
}

const createPiece = (
  type: TetrominoType = randomPieceType()
): Piece => ({
  type,
  rotation: 0,
  x: 3,
  y: 0,
})

const rotatePoints = (
  points: Point[],
  rotation: number
): Point[] => {
  if (rotation === 0) {
    return points.map((point) => ({ ...point }))
  }

  return points.map((point) => {
    let x = point.x
    let y = point.y

    if (rotation === 1) {
      return {
        x: 2 - y,
        y: x,
      }
    }

    if (rotation === 2) {
      return {
        x: 2 - x,
        y: 2 - y,
      }
    }

    return {
      x: y,
      y: 2 - x,
    }
  })
}

const getPieceCells = (piece: Piece): Point[] => {
  const points = rotatePoints(
    PIECES[piece.type],
    piece.rotation
  )

  return points.map((point) => ({
    x: point.x + piece.x,
    y: point.y + piece.y,
  }))
}

const canPlacePiece = (
  board: Board,
  piece: Piece
): boolean => {
  const cells = getPieceCells(piece)

  for (const cell of cells) {
    if (
      cell.x < 0 ||
      cell.x >= BOARD_WIDTH ||
      cell.y >= BOARD_HEIGHT
    ) {
      return false
    }

    if (
      cell.y >= 0 &&
      board[cell.y][cell.x] !== null
    ) {
      return false
    }
  }

  return true
}

const mergePiece = (
  board: Board,
  piece: Piece
): Board => {
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
  board: Board
): {
  board: Board
  lines: number
} => {
  const remainingRows = board.filter(
    (row) => row.some((cell) => cell === null)
  )

  const lines = BOARD_HEIGHT - remainingRows.length

  const emptyRows = Array.from(
    { length: lines },
    () => Array<Cell>(BOARD_WIDTH).fill(null)
  )

  return {
    board: [...emptyRows, ...remainingRows],
    lines,
  }
}

const getLineScore = (
  lines: number,
  level: number
): number => {
  if (lines === 1) return 100 * level
  if (lines === 2) return 300 * level
  if (lines === 3) return 500 * level
  if (lines === 4) return 800 * level

  return 0
}

const getFallDelay = (level: number): number => {
  return Math.max(
    80,
    850 - (level - 1) * 70
  )
}

const getGhostPiece = (
  board: Board,
  piece: Piece
): Piece => {
  let ghost = { ...piece }

  while (
    canPlacePiece(board, {
      ...ghost,
      y: ghost.y + 1,
    })
  ) {
    ghost = {
      ...ghost,
      y: ghost.y + 1,
    }
  }

  return ghost
}

const getNextBoard = (
  board: Board,
  currentPiece: Piece,
  nextPiece: Piece
): Board => {
  const preview = createEmptyBoard()

  const previewPiece: Piece = {
    ...nextPiece,
    x: 3,
    y: 2,
  }

  for (const cell of getPieceCells(previewPiece)) {
    if (
      cell.y >= 0 &&
      cell.y < BOARD_HEIGHT &&
      cell.x >= 0 &&
      cell.x < BOARD_WIDTH
    ) {
      preview[cell.y][cell.x] =
        previewPiece.type
    }
  }

  return preview
}

function Tetris() {
  const navigate = useNavigate()

  const [board, setBoard] = useState<Board>(
    createEmptyBoard
  )

  const [currentPiece, setCurrentPiece] =
    useState<Piece>(() => createPiece())

  const [nextPiece, setNextPiece] =
    useState<Piece>(() => createPiece())

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [combo, setCombo] = useState(-1)

  const [bestScore, setBestScore] =
    useState<number>(() => getBestScore())

  const [isPaused, setIsPaused] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)

  const gameStartedRef = useRef(false)


  useEffect(() => {
    gameStartedRef.current = true
    }, [])

  const dropTimerRef =
    useRef<number | null>(null)

  const scoreRef = useRef(score)
  const linesRef = useRef(lines)
  const levelRef = useRef(level)
  const comboRef = useRef(combo)

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    linesRef.current = lines
  }, [lines])

  useEffect(() => {
    levelRef.current = level
  }, [level])

  useEffect(() => {
    comboRef.current = combo
  }, [combo])

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard())

    const first = createPiece()
    const second = createPiece()

    setCurrentPiece(first)
    setNextPiece(second)

    setScore(0)
    setLines(0)
    setLevel(1)
    setCombo(-1)

    setIsPaused(false)
    setIsGameOver(false)

    gameStartedRef.current = false
  }, [])

  const finishGame = useCallback(() => {
    setIsGameOver(true)
    setIsPaused(false)

    const finalScore = scoreRef.current

    if (finalScore > getBestScore()) {
      saveBestScore(finalScore)
      setBestScore(finalScore)
    }
  }, [])

  const spawnNextPiece = useCallback(
    (
      updatedBoard: Board,
      upcoming: Piece
    ) => {
      const newPiece = createPiece(upcoming.type)
      const followingPiece = createPiece()

      if (!canPlacePiece(updatedBoard, newPiece)) {
        finishGame()
        return
      }

      setCurrentPiece(newPiece)
      setNextPiece(followingPiece)
    },
    [finishGame]
  )

  const lockPiece = useCallback(
    (piece: Piece) => {
      const mergedBoard = mergePiece(
        board,
        piece
      )

      const result = clearLines(mergedBoard)

      setBoard(result.board)

      if (result.lines > 0) {
        const currentLevel = levelRef.current

        const basePoints = getLineScore(
          result.lines,
          currentLevel
        )

        const previousCombo = comboRef.current
        const newCombo = previousCombo + 1

        const comboBonus =
          newCombo > 0
            ? newCombo * 50 * currentLevel
            : 0

        const totalPoints =
          basePoints + comboBonus

        setScore((previous) => {
          const updated = previous + totalPoints

          if (updated > getBestScore()) {
            saveBestScore(updated)
            setBestScore(updated)
          }

          return updated
        })

        setCombo(newCombo)

        const newLines =
          linesRef.current + result.lines

        setLines(newLines)

        const newLevel =
          Math.floor(newLines / 10) + 1

        setLevel(newLevel)
      } else {
        setCombo(-1)
      }

      spawnNextPiece(
        result.board,
        nextPiece
      )
    },
    [
      board,
      nextPiece,
      spawnNextPiece,
    ]
  )

  const movePiece = useCallback(
    (dx: number, dy: number): boolean => {
      if (
        isPaused ||
        isGameOver
      ) {
        return false
      }

      const movedPiece: Piece = {
        ...currentPiece,
        x: currentPiece.x + dx,
        y: currentPiece.y + dy,
      }

      if (
        canPlacePiece(
          board,
          movedPiece
        )
      ) {
        setCurrentPiece(movedPiece)
        return true
      }

      return false
    },
    [
      board,
      currentPiece,
      isPaused,
      isGameOver,
    ]
  )

  const softDrop = useCallback(() => {
    if (
      isPaused ||
      isGameOver
    ) {
      return
    }

    if (!gameStartedRef.current) {
      gameStartedRef.current = true
    }

    const moved = movePiece(0, 1)

    if (moved) {
      setScore((previous) => previous + 1)
    } else {
      lockPiece(currentPiece)
    }
  }, [
    movePiece,
    lockPiece,
    currentPiece,
    isPaused,
    isGameOver,
  ])

  const hardDrop = useCallback(() => {
    if (
      isPaused ||
      isGameOver
    ) {
      return
    }

    if (!gameStartedRef.current) {
      gameStartedRef.current = true
    }

    let distance = 0
    let droppedPiece = {
      ...currentPiece,
    }

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

    setScore(
      (previous) =>
        previous + distance * 2
    )

    setCurrentPiece(droppedPiece)
    lockPiece(droppedPiece)
  }, [
    board,
    currentPiece,
    isPaused,
    isGameOver,
    lockPiece,
  ])

  const rotatePiece = useCallback(() => {
    if (
      isPaused ||
      isGameOver
    ) {
      return
    }

    if (!gameStartedRef.current) {
      gameStartedRef.current = true
    }

    const nextRotation =
      (currentPiece.rotation + 1) % 4

    const rotatedPiece: Piece = {
      ...currentPiece,
      rotation: nextRotation,
    }

    if (
      canPlacePiece(
        board,
        rotatedPiece
      )
    ) {
      setCurrentPiece(rotatedPiece)
      return
    }

    // Small wall kicks.
    const kicks = [
      -1,
      1,
      -2,
      2,
    ]

    for (const kick of kicks) {
      const kickedPiece: Piece = {
        ...rotatedPiece,
        x: rotatedPiece.x + kick,
      }

      if (
        canPlacePiece(
          board,
          kickedPiece
        )
      ) {
        setCurrentPiece(kickedPiece)
        return
      }
    }
  }, [
    board,
    currentPiece,
    isPaused,
    isGameOver,
  ])

  const moveLeft = useCallback(() => {
    if (!gameStartedRef.current) {
      gameStartedRef.current = true
    }

    movePiece(-1, 0)
  }, [movePiece])

  const moveRight = useCallback(() => {
    if (!gameStartedRef.current) {
      gameStartedRef.current = true
    }

    movePiece(1, 0)
  }, [movePiece])

  useEffect(() => {
    if (
      isPaused ||
      isGameOver
    ) {
      return
    }

    if (
      !gameStartedRef.current
    ) {
      return
    }

    if (dropTimerRef.current !== null) {
      window.clearInterval(
        dropTimerRef.current
      )
    }

    dropTimerRef.current =
      window.setInterval(() => {
        setCurrentPiece((piece) => {
          const movedPiece = {
            ...piece,
            y: piece.y + 1,
          }

          if (
            canPlacePiece(
              board,
              movedPiece
            )
          ) {
            return movedPiece
          }

          lockPiece(piece)

          return piece
        })
      }, getFallDelay(level))

    return () => {
      if (
        dropTimerRef.current !== null
      ) {
        window.clearInterval(
          dropTimerRef.current
        )

        dropTimerRef.current = null
      }
    }
  }, [
    board,
    level,
    isPaused,
    isGameOver,
    lockPiece,
  ])

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.code === 'Space'
      ) {
        event.preventDefault()

        if (!isGameOver) {
          setIsPaused(
            (previous) => !previous
          )
        }

        return
      }

      if (
        event.key.toLowerCase() === 'r'
      ) {
        resetGame()
        return
      }

      if (
        isPaused ||
        isGameOver
      ) {
        return
      }

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
          event.preventDefault()
          rotatePiece()
          break

        case 'z':
        case 'Z':
          event.preventDefault()
          rotatePiece()
          break

        case 'x':
        case 'X':
          event.preventDefault()
          rotatePiece()
          break

        case 'Enter':
          event.preventDefault()
          hardDrop()
          break

        default:
          break
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
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
    () =>
      getGhostPiece(
        board,
        currentPiece
      ),
    [
      board,
      currentPiece,
    ]
  )

  const displayBoard = useMemo(() => {
    const result = board.map((row) => [
      ...row,
    ])

    for (const cell of getPieceCells(
      ghostPiece
    )) {
      if (
        cell.y >= 0 &&
        cell.y < BOARD_HEIGHT &&
        cell.x >= 0 &&
        cell.x < BOARD_WIDTH &&
        result[cell.y][cell.x] === null
      ) {
        result[cell.y][cell.x] =
          `ghost-${currentPiece.type}`
      }
    }

    for (const cell of getPieceCells(
      currentPiece
    )) {
      if (
        cell.y >= 0 &&
        cell.y < BOARD_HEIGHT &&
        cell.x >= 0 &&
        cell.x < BOARD_WIDTH
      ) {
        result[cell.y][cell.x] =
          currentPiece.type
      }
    }

    return result
  }, [
    board,
    currentPiece,
    ghostPiece,
  ])

  const nextPreview = useMemo(() => {
    const preview = Array.from(
      { length: 4 },
      () => Array<Cell>(4).fill(null)
    )

    const piece = createPiece(
      nextPiece.type
    )

    piece.x = 0
    piece.y = 0

    for (const cell of getPieceCells(
      piece
    )) {
      if (
        cell.x >= 0 &&
        cell.x < 4 &&
        cell.y >= 0 &&
        cell.y < 4
      ) {
        preview[cell.y][cell.x] =
          nextPiece.type
      }
    }

    return preview
  }, [nextPiece])

  const getCellClass = (
    value: Cell
  ): string => {
    if (!value) {
      return 'bg-white/[0.018]'
    }

    if (value.startsWith('ghost-')) {
      return 'bg-white/[0.025] border border-white/15'
    }

    return 'bg-white/[0.14] border border-white/20'
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#08090D] text-white"
    >
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-5 sm:px-5 sm:py-8">

        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft size={17} />
            برگشت
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-lg font-black">
              T
            </div>

            <div>
              <h1 className="text-sm font-bold sm:text-base">
                تتریس
              </h1>

              <p className="text-xs text-white/40">
                رکوردت رو بشکن
              </p>
            </div>
          </div>
        </header>

        {/* Title */}
        <section className="mb-5 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
            <Trophy size={14} />
            رقابت امتیازی
          </div>

          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            تا کجا می‌تونی بری؟
          </h2>

          <p className="mt-2 text-sm text-white/40">
            خط‌ها را پاک کن، امتیاز بگیر و رکوردت را بشکن.
          </p>
        </section>

        {/* Stats */}
        <section className="mx-auto mb-4 grid max-w-[520px] grid-cols-3 gap-2 sm:gap-3">

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-center">
            <div className="mb-1 text-xs text-white/40">
              امتیاز
            </div>

            <div className="font-mono text-lg font-bold sm:text-xl">
              {score.toLocaleString('en-US')}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-center">
            <div className="mb-1 text-xs text-white/40">
              سطح
            </div>

            <div className="font-mono text-lg font-bold sm:text-xl">
              {level}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-xs text-white/40">
              <Trophy size={14} />
              رکورد
            </div>

            <div className="font-mono text-lg font-bold sm:text-xl">
              {bestScore.toLocaleString('en-US')}
            </div>
          </div>

        </section>

        {/* Game Area */}
        <section className="mx-auto flex max-w-[620px] flex-col items-center justify-center gap-4 sm:flex-row sm:items-start">

          {/* Board */}
          <div
            dir="ltr"
            className="relative w-[min(82vw,360px)] overflow-hidden rounded-2xl border border-white/10 bg-[#0D0F14] p-2 shadow-2xl"
          >
            <div className="grid aspect-[1/2] w-full grid-cols-10 overflow-hidden rounded-xl border border-white/10">
              {displayBoard.map(
                (row, rowIndex) =>
                  row.map(
                    (value, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`border border-white/[0.035] ${getCellClass(
                          value
                        )}`}
                      />
                    )
                  )
              )}
            </div>

            {/* Pause Overlay */}
            {isPaused &&
              !isGameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#08090D]/85 backdrop-blur-sm">
                  <div className="text-center">

                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                      <Pause size={24} />
                    </div>

                    <h3 className="text-lg font-bold">
                      بازی متوقف است
                    </h3>

                    <button
                      onClick={() =>
                        setIsPaused(false)
                      }
                      className="mt-5 flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white/90"
                    >
                      <Play size={16} />
                      ادامه بازی
                    </button>

                  </div>
                </div>
              )}

            {/* Game Over */}
            {isGameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#08090D]/90 px-5 backdrop-blur-sm">
                <div className="w-full max-w-xs text-center">

                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                    <Trophy size={28} />
                  </div>

                  <p className="text-sm text-white/40">
                    بازی تمام شد
                  </p>

                  <div className="mt-1 text-3xl font-black">
                    {score.toLocaleString(
                      'en-US'
                    )}
                  </div>

                  {score === bestScore &&
                    score > 0 && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold">
                        🏆 رکورد جدید!
                      </div>
                    )}

                  <div className="mt-4 text-xs text-white/35">
                    {lines} خط پاک شد
                  </div>

                  <button
                    onClick={resetGame}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90"
                  >
                    <RotateCcw size={17} />
                    بازی دوباره
                  </button>

                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="w-full max-w-[360px] sm:w-[170px]">

            {/* Next */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 text-center text-xs text-white/40">
                مهره بعدی
              </div>

              <div
                dir="ltr"
                className="mx-auto grid h-[100px] w-[100px] grid-cols-4 grid-rows-4 overflow-hidden rounded-xl border border-white/10 bg-[#0B0D12]"
              >
                {nextPreview.map(
                  (row, rowIndex) =>
                    row.map(
                      (value, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`border border-white/[0.025] ${
                            value
                              ? 'bg-white/[0.14]'
                              : ''
                          }`}
                        />
                      )
                    )
                )}
              </div>
            </div>

            {/* Combo */}
            {combo > 0 && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-center">
                <div className="text-xs text-white/35">
                  کمبو
                </div>

                <div className="mt-1 text-xl font-black">
                  ×{combo + 1}
                </div>
              </div>
            )}

            {/* Desktop Controls */}
            <div className="mt-3 hidden rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:block">
              <div className="space-y-2 text-xs leading-5 text-white/30">
                <div>
                  ← → حرکت
                </div>

                <div>
                  ↑ چرخش
                </div>

                <div>
                  ↓ سقوط سریع
                </div>

                <div>
                  Enter سقوط کامل
                </div>

                <div>
                  Space توقف
                </div>

                <div>
                  R شروع مجدد
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Mobile Controls */}
        <section
          dir="ltr"
          className="mx-auto mt-5 grid max-w-[360px] grid-cols-3 gap-2 sm:hidden"
        >
          <button
            onClick={moveLeft}
            disabled={isPaused || isGameOver}
            className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] transition active:scale-95 disabled:opacity-30"
          >
            <ChevronLeft size={23} />
          </button>

          <button
            onClick={rotatePiece}
            disabled={isPaused || isGameOver}
            className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-xs font-bold transition active:scale-95 disabled:opacity-30"
          >
            ↻
          </button>

          <button
            onClick={moveRight}
            disabled={isPaused || isGameOver}
            className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] transition active:scale-95 disabled:opacity-30"
          >
            <ChevronRight size={23} />
          </button>

          <button
            onClick={softDrop}
            disabled={isPaused || isGameOver}
            className="col-span-2 flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-bold transition active:scale-95 disabled:opacity-30"
          >
            <ChevronDown size={19} />
            سقوط سریع
          </button>

          <button
            onClick={hardDrop}
            disabled={isPaused || isGameOver}
            className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-xs font-bold transition active:scale-95 disabled:opacity-30"
          >
            سقوط کامل
          </button>
        </section>

        {/* Bottom Controls */}
        <section className="mx-auto mt-4 flex max-w-[560px] flex-wrap justify-center gap-2">

          <button
            onClick={() =>
              setIsPaused(
                (previous) => !previous
              )
            }
            disabled={isGameOver}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
          >
            {isPaused ? (
              <Play size={16} />
            ) : (
              <Pause size={16} />
            )}

            {isPaused
              ? 'ادامه'
              : 'توقف'}
          </button>

          <button
            onClick={resetGame}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            <RotateCcw size={16} />
            شروع مجدد
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Home size={16} />
            خانه
          </button>

        </section>

        {/* Instructions */}
        <section className="mx-auto mt-5 max-w-[560px] rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center">
          <p className="text-xs leading-6 text-white/30">
            در دسکتاپ با کلیدهای جهت‌دار بازی کن.
            <br />
            با Enter مهره را به پایین پرتاب کن.
            <br />
            <span className="text-white/20">
              هر ۱۰ خط یک سطح بالاتر می‌روی و سرعت بیشتر می‌شود.
            </span>
          </p>
        </section>

      </div>
    </main>
  )
}

export default Tetris