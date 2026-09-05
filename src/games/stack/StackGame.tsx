import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Trophy,
  RotateCcw,
  Layers,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Block = {
  x: number
  width: number
}

const GAME_WIDTH = 800
const BLOCK_HEIGHT = 42

const INITIAL_BLOCK_WIDTH = 260

const INITIAL_X =
  (GAME_WIDTH - INITIAL_BLOCK_WIDTH) / 2

const BLOCK_GAP = 3

function StackGame() {
  const navigate = useNavigate()

  const gameAreaRef =
    useRef<HTMLDivElement | null>(null)

  const movementAnimationRef =
    useRef<number | null>(null)

  const cameraAnimationRef =
    useRef<number | null>(null)

  const hitSound =
    useRef<HTMLAudioElement | null>(null)

  const gameOverSound =
    useRef<HTMLAudioElement | null>(null)

  const directionRef =
    useRef(1)

  const speedRef =
    useRef(3)

  const [gameStarted, setGameStarted] =
    useState(false)

  const [score, setScore] =
    useState(0)

  const [bestScore, setBestScore] =
    useState(0)

  const [blocks, setBlocks] =
    useState<Block[]>([])

  const [currentBlock, setCurrentBlock] =
    useState({
      x: 0,
      width: INITIAL_BLOCK_WIDTH,
    })

  const [cameraOffset, setCameraOffset] =
    useState(0)

  const [gameOver, setGameOver] =
    useState(false)

  const [isNewBest, setIsNewBest] =
    useState(false)

  /*
   * Sounds
   */
  useEffect(() => {
    hitSound.current =
      new Audio('/sounds/hit.wav')

    hitSound.current.volume = 0.45

    gameOverSound.current =
      new Audio('/sounds/gameover.wav')

    gameOverSound.current.volume = 0.6

    return () => {
      if (movementAnimationRef.current) {
        cancelAnimationFrame(
          movementAnimationRef.current
        )
      }

      if (cameraAnimationRef.current) {
        cancelAnimationFrame(
          cameraAnimationRef.current
        )
      }

      hitSound.current = null
      gameOverSound.current = null
    }
  }, [])

  /*
   * Hit sound
   */
  const playHitSound = () => {
    if (!hitSound.current) {
      return
    }

    hitSound.current.currentTime = 0

    hitSound.current
      .play()
      .catch(() => {})
  }

  /*
   * Game over sound
   */
  const playGameOverSound = () => {
    if (!gameOverSound.current) {
      return
    }

    gameOverSound.current.currentTime = 0

    gameOverSound.current
      .play()
      .catch(() => {})
  }

  /*
   * Start game
   */
  const startGame = () => {
    if (movementAnimationRef.current) {
      cancelAnimationFrame(
        movementAnimationRef.current
      )

      movementAnimationRef.current = null
    }

    if (cameraAnimationRef.current) {
      cancelAnimationFrame(
        cameraAnimationRef.current
      )

      cameraAnimationRef.current = null
    }

    setScore(0)

    setGameOver(false)

    setIsNewBest(false)

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
   * Moving block
   *
   * This is the ONLY continuous
   * game animation now.
   */
  useEffect(() => {
    if (!gameStarted || gameOver) {
      return
    }

    const animate = () => {
      setCurrentBlock((block) => {
        const maxX =
          GAME_WIDTH - block.width

        let nextX =
          block.x +
          directionRef.current *
            speedRef.current

        /*
         * Left edge
         */
        if (nextX <= 0) {
          nextX = 0
          directionRef.current = 1
        }

        /*
         * Right edge
         */
        if (nextX >= maxX) {
          nextX = maxX
          directionRef.current = -1
        }

        return {
          ...block,
          x: nextX,
        }
      })

      movementAnimationRef.current =
        requestAnimationFrame(animate)
    }

    movementAnimationRef.current =
      requestAnimationFrame(animate)

    return () => {
      if (movementAnimationRef.current) {
        cancelAnimationFrame(
          movementAnimationRef.current
        )

        movementAnimationRef.current = null
      }
    }
  }, [
    gameStarted,
    gameOver,
  ])

  /*
   * Smooth camera movement
   */
  const animateCamera = (
    from: number,
    to: number
  ) => {
    if (cameraAnimationRef.current) {
      cancelAnimationFrame(
        cameraAnimationRef.current
      )
    }

    if (from === to) {
      setCameraOffset(to)
      return
    }

    const duration = 280

    const startTime =
      performance.now()

    const animate = (
      currentTime: number
    ) => {
      const elapsed =
        currentTime - startTime

      const progress =
        Math.min(
          elapsed / duration,
          1
        )

      /*
       * Ease-out.
       */
      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        )

      const value =
        from +
        (to - from) *
          eased

      setCameraOffset(value)

      if (progress < 1) {
        cameraAnimationRef.current =
          requestAnimationFrame(
            animate
          )
      } else {
        cameraAnimationRef.current =
          null

        setCameraOffset(to)
      }
    }

    cameraAnimationRef.current =
      requestAnimationFrame(animate)
  }

  /*
   * Drop block
   */
  const dropBlock = () => {
    if (!gameStarted || gameOver) {
      return
    }

    const previousBlock =
      blocks[blocks.length - 1]

    if (!previousBlock) {
      return
    }

    /*
     * Current block boundaries
     */
    const currentLeft =
      currentBlock.x

    const currentRight =
      currentBlock.x +
      currentBlock.width

    /*
     * Previous block boundaries
     */
    const previousLeft =
      previousBlock.x

    const previousRight =
      previousBlock.x +
      previousBlock.width

    /*
     * Calculate overlap
     */
    const overlapLeft =
      Math.max(
        currentLeft,
        previousLeft
      )

    const overlapRight =
      Math.min(
        currentRight,
        previousRight
      )

    const overlapWidth =
      overlapRight -
      overlapLeft

    /*
     * Complete miss
     */
    if (overlapWidth <= 0) {
      setGameStarted(false)

      setGameOver(true)

      playGameOverSound()

      setBestScore((currentBest) => {
        if (score > currentBest) {
          setIsNewBest(true)
        }

        return Math.max(
          currentBest,
          score
        )
      })

      return
    }

    /*
     * Successful placement
     */
    playHitSound()

    const newBlock: Block = {
      x: overlapLeft,
      width: overlapWidth,
    }

    const newScore =
      score + 1

    /*
     * Add the new block immediately.
     */
    setBlocks((currentBlocks) => [
      ...currentBlocks,
      newBlock,
    ])

    setScore(newScore)

    /*
     * Increase speed.
     */
    const newSpeed =
      Math.min(
        9,
        speedRef.current + 0.18
      )

    speedRef.current =
      newSpeed

    /*
     * Change direction.
     */
    directionRef.current *= -1

    /*
     * Calculate tower height
     * after adding the block.
     */
    const nextTowerHeight =
      (blocks.length + 1) *
      BLOCK_HEIGHT

    /*
     * Get actual game area height.
     */
    const gameHeight =
      gameAreaRef.current
        ?.clientHeight ?? 600

    /*
     * Keep the tower below
     * approximately 140px from
     * the top of the game area.
     */
    const safeHeight =
      gameHeight - 140

    const nextCameraOffset =
      Math.max(
        0,
        nextTowerHeight -
          safeHeight
      )

    /*
     * Smoothly move camera.
     */
    animateCamera(
      cameraOffset,
      nextCameraOffset
    )

    /*
     * Spawn next moving block.
     */
    setCurrentBlock({
      x:
        directionRef.current === 1
          ? 0
          : GAME_WIDTH -
            overlapWidth,

      width: overlapWidth,
    })
  }

  const handleGameAreaClick = () => {
    dropBlock()
  }

  const isPlaying =
    gameStarted && !gameOver

  return (
    <main className="min-h-screen bg-[#08090D] text-white">

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-5 sm:py-8">

        {/* Header */}
        <header className="mb-5 flex items-center gap-3">

          <button
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <ArrowRight size={20} />
          </button>

          <div>
            <h1 className="text-xl font-black sm:text-2xl">
              برج‌سازی
            </h1>

            <p className="text-xs text-zinc-500">
              تا جایی که می‌تونی بالا برو
            </p>
          </div>

        </header>

        {/* Start Screen */}
        {!isPlaying && !gameOver && (
          <section className="flex flex-1 items-center justify-center">

            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 text-center shadow-2xl sm:p-9">

              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
                <Layers
                  size={40}
                  strokeWidth={1.7}
                />
              </div>

              <h2 className="text-3xl font-black">
                برجت رو بساز
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                بلوک متحرک رو در زمان مناسب بنداز
                و برجت رو بلندتر کن.
                اگه بیرون از بلوک قبلی فرود بیاد،
                بازی تمومه.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-2">

                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xs text-zinc-500">
                    هدف
                  </p>

                  <p className="mt-1 font-bold">
                    ساختن برج
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
                className="mt-7 w-full rounded-2xl bg-white px-5 py-4 font-bold text-black"
              >
                شروع بازی
              </button>

            </div>

          </section>
        )}

        {/* Game */}
        {isPlaying && (
          <section className="flex flex-1 flex-col">

            {/* Stats */}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center sm:p-4">
                <p className="text-xs text-zinc-500">
                  طبقه
                </p>

                <p className="mt-1 text-xl font-black sm:text-2xl">
                  {score}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center sm:p-4">
                <p className="text-xs text-zinc-500">
                  عرض بلوک
                </p>

                <p className="mt-1 text-xl font-black sm:text-2xl">
                  {Math.round(
                    currentBlock.width
                  )}
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
              ref={gameAreaRef}
              onClick={handleGameAreaClick}
              className="relative min-h-[500px] flex-1 cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] shadow-inner sm:min-h-[600px]"
            >

              {/* Grid */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                  backgroundSize:
                    '40px 40px',
                }}
              />

              {/* Tower */}
              <div
                className="pointer-events-none absolute left-1/2"
                style={{
                  width: GAME_WIDTH,

                  height:
                    blocks.length *
                    BLOCK_HEIGHT,

                  bottom:
                    32 -
                    cameraOffset,

                  transform:
                    'translateX(-50%)',
                }}
              >

                {blocks.map(
                  (block, index) => (
                    <div
                      key={index}
                      className="absolute rounded-lg bg-white shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                      style={{
                        width:
                          block.width,

                        height:
                          BLOCK_HEIGHT -
                          BLOCK_GAP,

                        left:
                          block.x,

                        bottom:
                          index *
                          BLOCK_HEIGHT,
                      }}
                    />
                  )
                )}

              </div>

              {/* Moving Block */}
              <div
                className="pointer-events-none absolute rounded-lg border border-white/30 bg-white/80 text-black shadow-[0_0_25px_rgba(255,255,255,0.18)]"
                style={{
                  width:
                    currentBlock.width,

                  height:
                    BLOCK_HEIGHT -
                    BLOCK_GAP,

                  left:
                    `calc(50% - ${GAME_WIDTH / 2}px + ${currentBlock.x}px)`,

                  top: 32,
                }}
              />

              {/* Instructions */}
              <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-zinc-600">
                برای انداختن بلوک کلیک کن
              </div>

            </div>

          </section>
        )}

        {/* Game Over */}
        {gameOver && (
          <section className="flex flex-1 items-center justify-center">

            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">

              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
                <Trophy
                  size={38}
                  strokeWidth={1.7}
                />
              </div>

              <p className="text-sm text-zinc-500">
                برج فرو ریخت
              </p>

              <h2 className="mt-2 text-6xl font-black">
                {score}
              </h2>

              <p className="mt-2 text-zinc-400">
                طبقه
              </p>

              {isNewBest && (
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
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-bold text-black"
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

export default StackGame