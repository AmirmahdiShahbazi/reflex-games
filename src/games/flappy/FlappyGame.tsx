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

const DEVICE_TOKEN_KEY = 'reflex-games-device-token'
const BEST_SCORE_KEY = 'flappy-best-score'

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

function getGapSize(score: number) {
  return Math.max(MIN_GAP, START_GAP - score * 2)
}

function createPipe(x: number, score: number): Pipe {
  const gapSize = getGapSize(score)
  const minGapY = 100 + gapSize / 2
  const maxGapY = HEIGHT - GROUND_HEIGHT - 90 - gapSize / 2
  const gapY = minGapY + Math.random() * (maxGapY - minGapY)

  return {
    x,
    gapY,
    passed: false,
  }
}

function FlappyGame() {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  const birdRef = useRef<Bird>({
    y: HEIGHT / 2,
    velocity: 0,
  })

  const pipesRef = useRef<Pipe[]>([])
  const gameStateRef = useRef<GameState>('ready')
  const scoreRef = useRef(0)
  const lastTimeRef = useRef(0)

  const [gameState, setGameState] = useState<GameState>('ready')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState<number>(() => {
    return Number(localStorage.getItem(BEST_SCORE_KEY) || 0)
  })

  const [canvasSize, setCanvasSize] = useState({
    width: WIDTH,
    height: HEIGHT,
  })

  // Backend API states
  const [submittingScore, setSubmittingScore] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [scoreError, setScoreError] = useState('')

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
            game: 'flappy',
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

  /*
  |--------------------------------------------------------------------------
  | Reset Game
  |--------------------------------------------------------------------------
  */
  const resetGame = useCallback(() => {
    birdRef.current = {
      y: HEIGHT / 2,
      velocity: 0,
    }

    scoreRef.current = 0

    pipesRef.current = [
      createPipe(WIDTH + 200, 0),
      createPipe(WIDTH + 200 + PIPE_DISTANCE, 0),
      createPipe(WIDTH + 200 + PIPE_DISTANCE * 2, 0),
    ]

    gameStateRef.current = 'ready'
    setGameState('ready')
    setScore(0)

    // Reset Backend State
    setScoreResult(null)
    setScoreError('')
    setSubmittingScore(false)
  }, [])

  /*
  |--------------------------------------------------------------------------
  | End Game
  |--------------------------------------------------------------------------
  */
  const endGame = useCallback(() => {
    if (gameStateRef.current === 'gameover') {
      return
    }

    gameStateRef.current = 'gameover'
    setGameState('gameover')
    playSound('gameover')

    const finalScore = scoreRef.current
    submitScore(finalScore)
  }, [playSound, submitScore])

  /*
  |--------------------------------------------------------------------------
  | Flap
  |--------------------------------------------------------------------------
  */
  const flap = useCallback(() => {
    if (gameStateRef.current === 'gameover') {
      return
    }

    if (gameStateRef.current === 'ready') {
      gameStateRef.current = 'playing'
      setGameState('playing')
    }

    birdRef.current.velocity = FLAP_FORCE
    playSound('hit')
  }, [playSound])

  /*
  |--------------------------------------------------------------------------
  | Responsive Canvas
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const handleResize = () => {
      const maxWidth = Math.min(WIDTH, window.innerWidth - 32)
      const scale = maxWidth / WIDTH

      setCanvasSize({
        width: maxWidth,
        height: HEIGHT * scale,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Keyboard Controls
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault()
        flap()
      }

      if (event.code === 'KeyR' && gameStateRef.current === 'gameover') {
        event.preventDefault()
        resetGame()
      }

      if (event.code === 'Escape') {
        navigate('/')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [flap, navigate, resetGame])

  /*
  |--------------------------------------------------------------------------
  | Main Game Loop
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = WIDTH
    canvas.height = HEIGHT

    resetGame()
    lastTimeRef.current = 0

    const update = (delta: number) => {
      const state = gameStateRef.current

      if (state === 'ready') {
        birdRef.current.y =
          HEIGHT / 2 + Math.sin(performance.now() / 250) * 8
        birdRef.current.velocity = 0
        return
      }

      if (state !== 'playing') {
        return
      }

      const bird = birdRef.current
      const pipes = pipesRef.current
      const currentScore = scoreRef.current

      const speed = Math.min(START_SPEED + currentScore * 7, MAX_SPEED)
      const gapSize = getGapSize(currentScore)

      bird.velocity += GRAVITY * delta
      bird.y += bird.velocity * delta

      for (const pipe of pipes) {
        pipe.x -= speed * delta
      }

      for (const pipe of pipes) {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
          pipe.passed = true
          scoreRef.current += 1
          setScore(scoreRef.current)
          playSound('hit')
        }
      }

      const lastPipe = pipes[pipes.length - 1]
      if (lastPipe && lastPipe.x < WIDTH - PIPE_DISTANCE) {
        pipes.push(
          createPipe(lastPipe.x + PIPE_DISTANCE, scoreRef.current),
        )
      }

      while (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < -50) {
        pipes.shift()
      }

      const birdLeft = BIRD_X - BIRD_SIZE / 2
      const birdRight = BIRD_X + BIRD_SIZE / 2
      const birdTop = bird.y - BIRD_SIZE / 2
      const birdBottom = bird.y + BIRD_SIZE / 2

      if (birdTop <= 0 || birdBottom >= HEIGHT - GROUND_HEIGHT) {
        endGame()
        return
      }

      for (const pipe of pipes) {
        const gapTop = pipe.gapY - gapSize / 2
        const gapBottom = pipe.gapY + gapSize / 2
        const pipeLeft = pipe.x
        const pipeRight = pipe.x + PIPE_WIDTH

        const horizontalHit = birdRight > pipeLeft && birdLeft < pipeRight
        if (!horizontalHit) continue

        const hitTopPipe = birdTop < gapTop
        const hitBottomPipe = birdBottom > gapBottom

        if (hitTopPipe || hitBottomPipe) {
          endGame()
          return
        }
      }
    }

    const draw = () => {
      drawBackground(ctx)
      drawPipes(ctx, pipesRef.current, scoreRef.current)
      drawGround(ctx)
      drawBird(ctx, birdRef.current)
    }

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
      }

      let delta = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      delta = Math.min(delta, 0.035)

      update(delta)
      draw()

      animationRef.current = requestAnimationFrame(loop)
    }

    animationRef.current = requestAnimationFrame(loop)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
      animationRef.current = null
      lastTimeRef.current = 0
    }
  }, [endGame, playSound, resetGame])

  return (
    <main dir="rtl" className="min-h-screen bg-[#08090D] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6">

        {/* Header */}
        <header className="mb-5 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
          >
            <ArrowLeft size={18} />
            بازگشت
          </button>

          <div className="text-center">
            <h1 className="text-xl font-black sm:text-2xl">فلاپی برد</h1>
            <p className="mt-1 text-xs text-white/40 sm:text-sm">
              پرواز کن و رکوردت رو بشکن
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Trophy size={17} className="text-yellow-400" />
            <div className="text-right">
              <div className="text-[10px] text-white/40">رکورد</div>
              <div className="text-sm font-black">{bestScore}</div>
            </div>
          </div>
        </header>

        {/* Score */}
        <div className="mb-4 flex justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-9 py-3 text-center">
            <div className="text-xs text-white/40">امتیاز</div>
            <div className="mt-1 text-3xl font-black tabular-nums">
              {score}
            </div>
          </div>
        </div>

        {/* Game Canvas Container */}
        <div className="flex flex-1 items-center justify-center">
          <div
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
            }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={flap}
              className="block h-full w-full touch-none select-none cursor-pointer"
            />

            {/* Ready overlay */}
            {gameState === 'ready' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl border border-white/10 bg-black/70 px-8 py-6 text-center backdrop-blur-sm">
                  <Play size={30} className="mx-auto mb-3 text-white" />
                  <h2 className="text-xl font-bold">آماده‌ای؟</h2>
                  <p className="mt-2 text-xs text-white/60">
                    برای پرواز کلیک کن یا فاصله (Space) بزن
                  </p>
                </div>
              </div>
            )}

            {/* Game over modal with Leaderboard */}
            {gameState === 'gameover' && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
                <div className="max-h-[92%] w-full max-w-sm overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0F1015] p-6 text-center shadow-2xl">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <Trophy size={28} className="text-yellow-400" />
                  </div>

                  <h2 className="text-xl font-black">بازی تمام شد!</h2>

                  {/* Score & Record Summary */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="text-[11px] text-white/40">امتیاز نهایی</div>
                      <div className="mt-1 text-2xl font-black">{score}</div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="text-[11px] text-white/40">بهترین رکورد</div>
                      <div className="mt-1 text-2xl font-black">{bestScore}</div>
                    </div>
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

                  {/* Backend Result & Leaderboard */}
                  {scoreResult && (
                    <div className="mt-4 space-y-3">
                      {/* Rank Card */}
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[11px] text-zinc-500">رتبه شما در جدول</p>
                        <p className="mt-1 text-2xl font-black">
                          #{scoreResult.position}
                        </p>
                      </div>

                      {/* Leaderboard Table */}
                      {scoreResult.players && scoreResult.players.length > 0 && (
                        <div className="overflow-hidden rounded-2xl border border-white/10">
                          <div className="border-b border-white/10 bg-white/[0.03] px-3 py-2 text-right">
                            <p className="text-[11px] font-bold text-zinc-400">
                              جدول بازیکنان
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

                  {/* Buttons */}
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
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      <Home size={16} />
                      خانه
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls Hint */}
        <p className="mt-5 text-center text-xs text-white/30">
          کلیک کنید یا از کلید Space / ArrowUp برای پرواز استفاده کنید
        </p>

      </div>
    </main>
  )
}

/* ─────────────────────────────
   Canvas Drawing Helpers
───────────────────────────── */

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  gradient.addColorStop(0, '#151A27')
  gradient.addColorStop(1, '#090D16')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let i = 0; i < 8; i++) {
    const x = 60 + i * 120
    const y = 90 + Math.sin(i * 2.1) * 55

    ctx.beginPath()
    ctx.arc(x, y, 35, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPipes(ctx: CanvasRenderingContext2D, pipes: Pipe[], score: number) {
  const gapSize = getGapSize(score)

  for (const pipe of pipes) {
    const gapTop = pipe.gapY - gapSize / 2
    const gapBottom = pipe.gapY + gapSize / 2

    drawPipe(ctx, pipe.x, 0, PIPE_WIDTH, gapTop, false)
    drawPipe(
      ctx,
      pipe.x,
      gapBottom,
      PIPE_WIDTH,
      HEIGHT - GROUND_HEIGHT - gapBottom,
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

  ctx.fillStyle = '#E8E8E8'
  ctx.fillRect(x, y, width, height)

  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = 3
  ctx.strokeRect(x, y, width, height)

  const capHeight = 20
  const capY = isBottom ? y : y + height - capHeight

  ctx.fillStyle = '#F7F7F7'
  ctx.fillRect(x - 7, capY, width + 14, capHeight)

  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.strokeRect(x - 7, capY, width + 14, capHeight)
}

function drawGround(ctx: CanvasRenderingContext2D) {
  const groundY = HEIGHT - GROUND_HEIGHT

  ctx.fillStyle = '#111722'
  ctx.fillRect(0, groundY, WIDTH, GROUND_HEIGHT)

  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(WIDTH, groundY)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  for (let x = -40; x < WIDTH + 40; x += 40) {
    ctx.fillRect(x, groundY + 18, 20, 4)
  }
}

function drawBird(ctx: CanvasRenderingContext2D, bird: Bird) {
  const x = BIRD_X
  const y = bird.y

  ctx.save()
  const rotation = Math.max(-0.35, Math.min(1, bird.velocity / 650))
  ctx.translate(x, y)
  ctx.rotate(rotation)

  // Body
  ctx.fillStyle = '#F5F5F5'
  ctx.beginPath()
  ctx.roundRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE, 8)
  ctx.fill()

  // Wing
  ctx.fillStyle = '#CFCFCF'
  ctx.beginPath()
  ctx.ellipse(-5, 5, 10, 6, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // Eye
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(7, -7, 4, 0, Math.PI * 2)
  ctx.fill()

  // Beak
  ctx.fillStyle = '#AAAAAA'
  ctx.beginPath()
  ctx.moveTo(12, -1)
  ctx.lineTo(25, 4)
  ctx.lineTo(12, 8)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

export default FlappyGame