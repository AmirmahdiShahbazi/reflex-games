import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Home,
  Play,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const WIDTH = 800
const HEIGHT = 600

const GROUND_HEIGHT = 70

const BIRD_X = 170
const BIRD_SIZE = 28

const GRAVITY = 1350
const FLAP_FORCE = -460

const PIPE_WIDTH = 78
const PIPE_DISTANCE = 330

const START_SPEED = 230
const MAX_SPEED = 430

const START_GAP = 200
const MIN_GAP = 135

interface Bird {
  y: number
  velocity: number
}

interface Pipe {
  x: number
  gapY: number
  passed: boolean
}

type GameState = 'ready' | 'playing' | 'gameover'

function getGapSize(score: number) {
  return Math.max(
    MIN_GAP,
    START_GAP - score * 2,
  )
}

function createPipe(
  x: number,
  score: number,
): Pipe {
  const gapSize = getGapSize(score)

  const minGapY =
    100 + gapSize / 2

  const maxGapY =
    HEIGHT -
    GROUND_HEIGHT -
    90 -
    gapSize / 2

  const gapY =
    minGapY +
    Math.random() *
      (maxGapY - minGapY)

  return {
    x,
    gapY,
    passed: false,
  }
}

function FlappyGame() {
  const navigate = useNavigate()

  const canvasRef =
    useRef<HTMLCanvasElement>(null)

  const animationRef =
    useRef<number | null>(null)

  const birdRef = useRef<Bird>({
    y: HEIGHT / 2,
    velocity: 0,
  })

  const pipesRef =
    useRef<Pipe[]>([])

  const gameStateRef =
    useRef<GameState>('ready')

  const scoreRef =
    useRef(0)

  const lastTimeRef =
    useRef(0)

  const [gameState, setGameState] =
    useState<GameState>('ready')

  const [score, setScore] =
    useState(0)

  const [bestScore, setBestScore] =
    useState(() => {
      return Number(
        localStorage.getItem(
          'flappy-best-score',
        ) || 0,
      )
    })

  const [canvasSize, setCanvasSize] =
    useState({
      width: WIDTH,
      height: HEIGHT,
    })

  const playSound = useCallback(
    (
      file: string,
      volume: number,
    ) => {
      const audio = new Audio(
        `/sounds/${file}`,
      )

      audio.volume = volume

      audio.play().catch(() => {})
    },
    [],
  )

  const resetGame = useCallback(() => {
    birdRef.current = {
      y: HEIGHT / 2,
      velocity: 0,
    }

    scoreRef.current = 0

    pipesRef.current = [
      createPipe(
        WIDTH + 200,
        0,
      ),
      createPipe(
        WIDTH + 200 + PIPE_DISTANCE,
        0,
      ),
      createPipe(
        WIDTH + 200 +
          PIPE_DISTANCE * 2,
        0,
      ),
    ]

    gameStateRef.current = 'ready'

    setGameState('ready')
    setScore(0)
  }, [])

  const endGame = useCallback(() => {
    if (
      gameStateRef.current ===
      'gameover'
    ) {
      return
    }

    gameStateRef.current = 'gameover'

    setGameState('gameover')

    playSound(
      'gameover.wav',
      0.35,
    )

    const finalScore =
      scoreRef.current

    setBestScore((currentBest) => {
      if (finalScore > currentBest) {
        localStorage.setItem(
          'flappy-best-score',
          String(finalScore),
        )

        return finalScore
      }

      return currentBest
    })
  }, [playSound])

  const flap = useCallback(() => {
    if (
      gameStateRef.current ===
      'gameover'
    ) {
      resetGame()
      return
    }

    if (
      gameStateRef.current ===
      'ready'
    ) {
      gameStateRef.current =
        'playing'

      setGameState('playing')
    }

    birdRef.current.velocity =
      FLAP_FORCE

    playSound(
      'hit.wav',
      0.12,
    )
  }, [playSound, resetGame])

  /*
   * Responsive canvas display size.
   */
  useEffect(() => {
    const handleResize = () => {
      const maxWidth = Math.min(
        WIDTH,
        window.innerWidth - 32,
      )

      const scale =
        maxWidth / WIDTH

      setCanvasSize({
        width: maxWidth,
        height: HEIGHT * scale,
      })
    }

    handleResize()

    window.addEventListener(
      'resize',
      handleResize,
    )

    return () => {
      window.removeEventListener(
        'resize',
        handleResize,
      )
    }
  }, [])

  /*
   * Keyboard controls.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.code === 'Space' ||
        event.code === 'ArrowUp'
      ) {
        event.preventDefault()
        flap()
      }

      if (
        event.code === 'Escape'
      ) {
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
  }, [flap, navigate])

  /*
   * Main game loop.
   */
  useEffect(() => {
    const canvas =
      canvasRef.current

    if (!canvas) return

    const ctx =
      canvas.getContext('2d')

    if (!ctx) return

    canvas.width = WIDTH
    canvas.height = HEIGHT

    resetGame()

    lastTimeRef.current = 0

    const update = (
      delta: number,
    ) => {
      const state =
        gameStateRef.current

      /*
       * Waiting screen.
       */
      if (state === 'ready') {
        birdRef.current.y =
          HEIGHT / 2 +
          Math.sin(
            performance.now() /
              250,
          ) *
            8

        birdRef.current.velocity = 0

        return
      }

      /*
       * Don't update after death.
       */
      if (state !== 'playing') {
        return
      }

      const bird =
        birdRef.current

      const pipes =
        pipesRef.current

      const currentScore =
        scoreRef.current

      /*
       * Difficulty increases with score.
       */
      const speed = Math.min(
        START_SPEED +
          currentScore * 7,
        MAX_SPEED,
      )

      const gapSize =
        getGapSize(
          currentScore,
        )

      /*
       * Bird physics.
       */
      bird.velocity +=
        GRAVITY * delta

      bird.y +=
        bird.velocity * delta

      /*
       * Move pipes.
       */
      for (const pipe of pipes) {
        pipe.x -=
          speed * delta
      }

      /*
       * Score when bird passes pipe.
       */
      for (const pipe of pipes) {
        if (
          !pipe.passed &&
          pipe.x + PIPE_WIDTH <
            BIRD_X
        ) {
          pipe.passed = true

          scoreRef.current += 1

          setScore(
            scoreRef.current,
          )

          playSound(
            'hit.wav',
            0.16,
          )
        }
      }

      /*
       * Add new pipes.
       */
      const lastPipe =
        pipes[pipes.length - 1]

      if (
        lastPipe &&
        lastPipe.x <
          WIDTH - PIPE_DISTANCE
      ) {
        pipes.push(
          createPipe(
            lastPipe.x +
              PIPE_DISTANCE,
            scoreRef.current,
          ),
        )
      }

      /*
       * Remove old pipes.
       */
      while (
        pipes.length > 0 &&
        pipes[0].x +
          PIPE_WIDTH <
          -50
      ) {
        pipes.shift()
      }

      /*
       * Bird collision box.
       */
      const birdLeft =
        BIRD_X -
        BIRD_SIZE / 2

      const birdRight =
        BIRD_X +
        BIRD_SIZE / 2

      const birdTop =
        bird.y -
        BIRD_SIZE / 2

      const birdBottom =
        bird.y +
        BIRD_SIZE / 2

      /*
       * Ceiling.
       */
      if (
        birdTop <= 0
      ) {
        endGame()
        return
      }

      /*
       * Ground.
       */
      if (
        birdBottom >=
        HEIGHT -
          GROUND_HEIGHT
      ) {
        endGame()
        return
      }

      /*
       * Pipe collision.
       */
      for (const pipe of pipes) {
        const gapTop =
          pipe.gapY -
          gapSize / 2

        const gapBottom =
          pipe.gapY +
          gapSize / 2

        const pipeLeft =
          pipe.x

        const pipeRight =
          pipe.x +
          PIPE_WIDTH

        const horizontalHit =
          birdRight >
            pipeLeft &&
          birdLeft <
            pipeRight

        if (!horizontalHit) {
          continue
        }

        const hitTopPipe =
          birdTop < gapTop

        const hitBottomPipe =
          birdBottom >
          gapBottom

        if (
          hitTopPipe ||
          hitBottomPipe
        ) {
          endGame()
          return
        }
      }
    }

    const draw = () => {
      /*
       * Background
       */
      drawBackground(ctx)

      /*
       * Pipes
       */
      drawPipes(
        ctx,
        pipesRef.current,
        scoreRef.current,
      )

      /*
       * Ground
       */
      drawGround(ctx)

      /*
       * Bird
       */
      drawBird(
        ctx,
        birdRef.current,
      )
    }

    const loop = (
      timestamp: number,
    ) => {
      if (
        lastTimeRef.current === 0
      ) {
        lastTimeRef.current =
          timestamp
      }

      let delta =
        (timestamp -
          lastTimeRef.current) /
        1000

      lastTimeRef.current =
        timestamp

      /*
       * Prevent huge physics jumps
       * if the browser freezes briefly.
       */
      delta = Math.min(
        delta,
        0.035,
      )

      update(delta)
      draw()

      animationRef.current =
        requestAnimationFrame(
          loop,
        )
    }

    animationRef.current =
      requestAnimationFrame(
        loop,
      )

    return () => {
      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current,
        )
      }

      animationRef.current =
        null

      lastTimeRef.current = 0
    }
  }, [
    endGame,
    playSound,
    resetGame,
  ])

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#08090D] text-white"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6">

        {/* Header */}
        <header className="mb-5 flex items-center justify-between">

          <button
            onClick={() =>
              navigate('/')
            }
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
          >
            <ArrowLeft size={18} />
            بازگشت
          </button>

          <div className="text-center">
            <h1 className="text-xl font-bold sm:text-2xl">
              فلاپی برد
            </h1>

            <p className="mt-1 text-xs text-white/40 sm:text-sm">
              پرواز کن و رکوردت رو بشکن
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Trophy size={17} />

            <div className="text-right">
              <div className="text-[10px] text-white/40">
                رکورد
              </div>

              <div className="text-sm font-bold">
                {bestScore}
              </div>
            </div>
          </div>

        </header>

        {/* Score */}
        <div className="mb-4 flex justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-9 py-3 text-center">
            <div className="text-xs text-white/40">
              امتیاز
            </div>

            <div className="mt-1 text-3xl font-bold tabular-nums">
              {score}
            </div>
          </div>
        </div>

        {/* Game */}
        <div className="flex flex-1 items-center justify-center">

          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
            style={{
              width:
                canvasSize.width,
              height:
                canvasSize.height,
            }}
          >

            <canvas
              ref={canvasRef}
              onPointerDown={flap}
              className="block h-full w-full touch-none select-none"
            />

            {/* Ready */}
            {gameState ===
              'ready' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                <div className="rounded-2xl border border-white/10 bg-black/70 px-8 py-6 text-center backdrop-blur-sm">

                  <Play
                    size={30}
                    className="mx-auto mb-3"
                  />

                  <h2 className="text-xl font-bold">
                    آماده‌ای؟
                  </h2>

                  <p className="mt-2 text-sm text-white/60">
                    برای پرواز کلیک کن
                  </p>

                </div>

              </div>
            )}

            {/* Game over */}
            {gameState ===
              'gameover' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55">

                <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#101522]/95 p-7 text-center shadow-2xl">

                  <h2 className="text-2xl font-bold">
                    بازی تمام شد
                  </h2>

                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="rounded-xl bg-white/5 p-4">
                      <div className="text-xs text-white/40">
                        امتیاز
                      </div>

                      <div className="mt-1 text-2xl font-bold">
                        {score}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/5 p-4">
                      <div className="text-xs text-white/40">
                        رکورد
                      </div>

                      <div className="mt-1 text-2xl font-bold">
                        {bestScore}
                      </div>
                    </div>

                  </div>

                  {score > 0 &&
                    score ===
                      bestScore && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 py-2 text-sm">
                        رکورد جدید
                      </div>
                    )}

                  <div className="mt-5 flex gap-3">

                    <button
                      onClick={
                        resetGame
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-black hover:bg-white/90"
                    >
                      <RotateCcw
                        size={18}
                      />
                      دوباره
                    </button>

                    <button
                      onClick={() =>
                        navigate('/')
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 hover:bg-white/10"
                    >
                      <Home
                        size={18}
                      />
                      خانه
                    </button>

                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

        {/* Controls */}
        <p className="mt-5 text-center text-xs text-white/30">
          کلیک برای پرواز
        </p>

      </div>
    </main>
  )
}

/* ─────────────────────────────
   Drawing
───────────────────────────── */

function drawBackground(
  ctx: CanvasRenderingContext2D,
) {
  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      HEIGHT,
    )

  gradient.addColorStop(
    0,
    '#151A27',
  )

  gradient.addColorStop(
    1,
    '#090D16',
  )

  ctx.fillStyle = gradient

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT,
  )

  /*
   * Background circles.
   */
  ctx.fillStyle =
    'rgba(255,255,255,0.025)'

  for (let i = 0; i < 8; i++) {
    const x =
      60 + i * 120

    const y =
      90 +
      Math.sin(i * 2.1) *
        55

    ctx.beginPath()

    ctx.arc(
      x,
      y,
      35,
      0,
      Math.PI * 2,
    )

    ctx.fill()
  }
}

function drawPipes(
  ctx: CanvasRenderingContext2D,
  pipes: Pipe[],
  score: number,
) {
  const gapSize =
    getGapSize(score)

  for (const pipe of pipes) {
    const gapTop =
      pipe.gapY -
      gapSize / 2

    const gapBottom =
      pipe.gapY +
      gapSize / 2

    /*
     * Top pipe.
     */
    drawPipe(
      ctx,
      pipe.x,
      0,
      PIPE_WIDTH,
      gapTop,
      false,
    )

    /*
     * Bottom pipe.
     */
    drawPipe(
      ctx,
      pipe.x,
      gapBottom,
      PIPE_WIDTH,
      HEIGHT -
        GROUND_HEIGHT -
        gapBottom,
      true,
    )
  }
}

function drawPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  isBottom: boolean,
) {
  if (height <= 0) return

  /*
   * Main pipe.
   */
  ctx.fillStyle = '#E8E8E8'

  ctx.fillRect(
    x,
    y,
    width,
    height,
  )

  /*
   * Subtle border.
   */
  ctx.strokeStyle =
    'rgba(0,0,0,0.18)'

  ctx.lineWidth = 3

  ctx.strokeRect(
    x,
    y,
    width,
    height,
  )

  /*
   * Pipe cap.
   */
  const capHeight = 20

  const capY = isBottom
    ? y
    : y +
      height -
      capHeight

  ctx.fillStyle = '#F7F7F7'

  ctx.fillRect(
    x - 7,
    capY,
    width + 14,
    capHeight,
  )

  ctx.strokeStyle =
    'rgba(0,0,0,0.18)'

  ctx.strokeRect(
    x - 7,
    capY,
    width + 14,
    capHeight,
  )
}

function drawGround(
  ctx: CanvasRenderingContext2D,
) {
  const groundY =
    HEIGHT -
    GROUND_HEIGHT

  ctx.fillStyle = '#111722'

  ctx.fillRect(
    0,
    groundY,
    WIDTH,
    GROUND_HEIGHT,
  )

  ctx.strokeStyle =
    'rgba(255,255,255,0.1)'

  ctx.lineWidth = 2

  ctx.beginPath()

  ctx.moveTo(
    0,
    groundY,
  )

  ctx.lineTo(
    WIDTH,
    groundY,
  )

  ctx.stroke()

  /*
   * Ground markings.
   */
  ctx.fillStyle =
    'rgba(255,255,255,0.035)'

  for (
    let x = -40;
    x < WIDTH + 40;
    x += 40
  ) {
    ctx.fillRect(
      x,
      groundY + 18,
      20,
      4,
    )
  }
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  bird: Bird,
) {
  const x = BIRD_X
  const y = bird.y

  ctx.save()

  /*
   * Bird rotation follows velocity.
   */
  const rotation =
    Math.max(
      -0.35,
      Math.min(
        1,
        bird.velocity / 650,
      ),
    )

  ctx.translate(x, y)

  ctx.rotate(rotation)

  /*
   * Body.
   */
  ctx.fillStyle = '#F5F5F5'

  ctx.beginPath()

  ctx.roundRect(
    -BIRD_SIZE / 2,
    -BIRD_SIZE / 2,
    BIRD_SIZE,
    BIRD_SIZE,
    8,
  )

  ctx.fill()

  /*
   * Wing.
   */
  ctx.fillStyle = '#CFCFCF'

  ctx.beginPath()

  ctx.ellipse(
    -5,
    5,
    10,
    6,
    -0.3,
    0,
    Math.PI * 2,
  )

  ctx.fill()

  /*
   * Eye.
   */
  ctx.fillStyle = '#111'

  ctx.beginPath()

  ctx.arc(
    7,
    -7,
    4,
    0,
    Math.PI * 2,
  )

  ctx.fill()

  /*
   * Beak.
   */
  ctx.fillStyle = '#AAAAAA'

  ctx.beginPath()

  ctx.moveTo(
    12,
    -1,
  )

  ctx.lineTo(
    25,
    4,
  )

  ctx.lineTo(
    12,
    8,
  )

  ctx.closePath()

  ctx.fill()

  ctx.restore()
}

export default FlappyGame