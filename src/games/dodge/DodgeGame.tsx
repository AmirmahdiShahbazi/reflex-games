import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Trophy,
  RotateCcw,
  Shield,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type EnemyType =
  | 'normal'
  | 'fast'
  | 'straight'
  | 'heavy'
  | 'zigzag'

type Enemy = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  type: EnemyType
  nearMissTriggered: boolean
  zigzagTimer: number
  zigzagDirection: number
}

type Player = {
  x: number
  y: number
}

/* PLAYER */
const PLAYER_SIZE = 22
const PLAYER_MARGIN = 18
const PLAYER_LERP = 20

/* ENEMIES */
const INITIAL_ENEMIES = 5
const MAX_ENEMIES = 30

const MIN_ENEMY_SIZE = 12
const MAX_ENEMY_SIZE = 25

/* SPEED - pixels per second */
const INITIAL_SPEED = 130
const MAX_SPEED = 650

/* SPAWN */
const SPAWN_CHECK_INTERVAL = 100

/* NEAR MISS */
const NEAR_MISS_DISTANCE = 20

/* SCORE */
const SCORE_INTERVAL = 1000

/* PHYSICS */
const BALL_BOUNCE = 0.9

/* ZIGZAG */
const ZIGZAG_INTERVAL = 0.5

function DodgeGame() {
  const navigate = useNavigate()

  const gameAreaRef =
    useRef<HTMLDivElement | null>(null)

  const animationRef =
    useRef<number | null>(null)

  const spawnTimerRef =
    useRef<number | null>(null)

  const lastFrameTimeRef =
    useRef<number | null>(null)

  const gameStartTimeRef =
    useRef(0)

  const lastScoreTimeRef =
    useRef(0)

  const lastNearMissTimeRef =
    useRef(0)

  const nextEnemyIdRef =
    useRef(0)

  const gameStartedRef =
    useRef(false)

  const gameOverRef =
    useRef(false)

  const playerRef =
    useRef<Player>({
      x: 50,
      y: 50,
    })

  const targetPlayerRef =
    useRef<Player>({
      x: 50,
      y: 50,
    })

  const enemiesRef =
    useRef<Enemy[]>([])

  const scoreRef =
    useRef(0)

  const nearMissesRef =
    useRef(0)

  const comboRef =
    useRef(0)

  const bestScoreRef =
    useRef(0)

  const enemySpeedRef =
    useRef(INITIAL_SPEED)

  const gameOverSound =
    useRef<HTMLAudioElement | null>(null)

  const nearMissSound =
    useRef<HTMLAudioElement | null>(null)

  const [gameStarted, setGameStarted] =
    useState(false)

  const [gameOver, setGameOver] =
    useState(false)

  const [score, setScore] =
    useState(0)

  const [bestScore, setBestScore] =
    useState(0)

  const [survivalTime, setSurvivalTime] =
    useState(0)

  const [nearMisses, setNearMisses] =
    useState(0)

  const [combo, setCombo] =
    useState(0)

  const [player, setPlayer] =
    useState<Player>({
      x: 50,
      y: 50,
    })

  const [enemies, setEnemies] =
    useState<Enemy[]>([])

  const [isNewBest, setIsNewBest] =
    useState(false)

  /*
   * SOUNDS
   */
  useEffect(() => {
    gameOverSound.current =
      new Audio('/sounds/gameover.wav')

    gameOverSound.current.volume = 0.6

    nearMissSound.current =
      new Audio('/sounds/hit.wav')

    nearMissSound.current.volume = 0.14

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(
          animationRef.current
        )
      }

      if (spawnTimerRef.current !== null) {
        clearInterval(
          spawnTimerRef.current
        )
      }
    }
  }, [])

  /*
   * PLAY GAME OVER SOUND
   */
  const playGameOverSound = () => {
    const sound =
      gameOverSound.current

    if (!sound) return

    sound.currentTime = 0

    sound.play().catch(() => {})
  }

  /*
   * PLAY NEAR MISS SOUND
   */
  const playNearMissSound = () => {
    const sound =
      nearMissSound.current

    if (!sound) return

    sound.currentTime = 0

    sound.play().catch(() => {})
  }

  /*
   * GET CURRENT GAME TIME
   */
  const getElapsedSeconds = () => {
    return (
      (performance.now() -
        gameStartTimeRef.current) /
      1000
    )
  }

  /*
   * DESIRED NUMBER OF BALLS
   *
   * 0 sec  = 5
   * 5 sec  = 8
   * 10 sec = 11
   * 15 sec = 15
   * 20 sec = 18
   * 30 sec = 25
   * 40 sec = 30
   */
  const getDesiredEnemyCount = () => {
    const seconds =
      getElapsedSeconds()

    return Math.min(
      MAX_ENEMIES,
      INITIAL_ENEMIES +
        Math.floor(seconds / 1.7)
    )
  }

  /*
   * CURRENT SPEED
   *
   * Gets considerably faster over time.
   */
  const getCurrentSpeed = () => {
    const seconds =
      getElapsedSeconds()

    return Math.min(
      MAX_SPEED,
      INITIAL_SPEED +
        seconds * 9 +
        Math.pow(seconds, 1.2) * 2
    )
  }

  /*
   * CREATE ENEMY
   */
  const createEnemy = (): Enemy => {
    const side =
      Math.floor(
        Math.random() * 4
      )

    const seconds =
      getElapsedSeconds()

    const difficulty =
      Math.min(
        1,
        seconds / 45
      )

    const random =
      Math.random()

    let type: EnemyType =
      'normal'

    /*
     * FAST
     */
    if (
      seconds > 4 &&
      random < 0.20 +
        difficulty * 0.08
    ) {
      type = 'fast'
    }

    /*
     * STRAIGHT
     */
    if (
      seconds > 9 &&
      random >= 0.72 &&
      random < 0.82
    ) {
      type = 'straight'
    }

    /*
     * HEAVY
     */
    if (
      seconds > 14 &&
      random >= 0.82 &&
      random < 0.92
    ) {
      type = 'heavy'
    }

    /*
     * ZIGZAG
     */
    if (
      seconds > 20 &&
      random >= 0.92
    ) {
      type = 'zigzag'
    }

    /*
     * SIZE
     */
    let size =
      MIN_ENEMY_SIZE +
      Math.random() *
        (
          MAX_ENEMY_SIZE -
          MIN_ENEMY_SIZE
        )

    if (type === 'heavy') {
      size =
        25 +
        Math.random() * 10
    }

    /*
     * SPAWN OUTSIDE ARENA
     */
    let x = 50
    let y = 50

    if (side === 0) {
      x =
        5 +
        Math.random() * 90

      y = -8
    }

    if (side === 1) {
      x = 108

      y =
        5 +
        Math.random() * 90
    }

    if (side === 2) {
      x =
        5 +
        Math.random() * 90

      y = 108
    }

    if (side === 3) {
      x = -8

      y =
        5 +
        Math.random() * 90
    }

    /*
     * AIM TOWARD PLAYER
     */
    const dx =
      playerRef.current.x - x

    const dy =
      playerRef.current.y - y

    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      ) || 1

    /*
     * SPEED
     */
    let speed =
      enemySpeedRef.current

    if (type === 'fast') {
      speed *= 1.55
    }

    if (type === 'straight') {
      speed *= 1.2
    }

    if (type === 'heavy') {
      speed *= 0.68
    }

    if (type === 'zigzag') {
      speed *= 1.1
    }

    speed *=
      0.9 +
      Math.random() * 0.2

    return {
      id:
        nextEnemyIdRef.current++,

      x,
      y,

      vx:
        (dx / distance) *
        speed,

      vy:
        (dy / distance) *
        speed,

      size,

      type,

      nearMissTriggered:
        false,

      zigzagTimer:
        Math.random() *
        ZIGZAG_INTERVAL,

      zigzagDirection:
        Math.random() > 0.5
          ? 1
          : -1,
    }
  }

  /*
   * START GAME
   */
  const startGame = () => {
    /*
     * Stop previous game.
     */
    if (animationRef.current !== null) {
      cancelAnimationFrame(
        animationRef.current
      )

      animationRef.current = null
    }

    if (spawnTimerRef.current !== null) {
      clearInterval(
        spawnTimerRef.current
      )

      spawnTimerRef.current = null
    }

    /*
     * Reset refs.
     */
    const initialPlayer = {
      x: 50,
      y: 50,
    }

    playerRef.current =
      initialPlayer

    targetPlayerRef.current =
      initialPlayer

    enemiesRef.current = []

    scoreRef.current = 0
    nearMissesRef.current = 0
    comboRef.current = 0

    enemySpeedRef.current =
      INITIAL_SPEED

    nextEnemyIdRef.current = 0

    gameStartedRef.current = true
    gameOverRef.current = false

    const now =
      performance.now()

    gameStartTimeRef.current =
      now

    lastFrameTimeRef.current =
      null

    lastScoreTimeRef.current =
      now

    lastNearMissTimeRef.current =
      now

    /*
     * Create initial balls.
     */
    for (
      let i = 0;
      i < INITIAL_ENEMIES;
      i++
    ) {
      enemiesRef.current.push(
        createEnemy()
      )
    }

    /*
     * React state.
     */
    setPlayer({
      ...initialPlayer,
    })

    setEnemies([
      ...enemiesRef.current,
    ])

    setScore(0)
    setSurvivalTime(0)
    setNearMisses(0)
    setCombo(0)

    setGameOver(false)
    setIsNewBest(false)
    setGameStarted(true)
  }

  /*
   * PLAYER MOVEMENT
   */
  const movePlayer = (
    clientX: number,
    clientY: number
  ) => {
    const arena =
      gameAreaRef.current

    if (!arena) return

    const rect =
      arena.getBoundingClientRect()

    let x =
      (
        (clientX - rect.left) /
        rect.width
      ) *
      100

    let y =
      (
        (clientY - rect.top) /
        rect.height
      ) *
      100

    const margin =
      Math.max(
        2,
        (
          PLAYER_MARGIN /
          Math.min(
            rect.width,
            rect.height
          )
        ) *
          100
      )

    x = Math.max(
      margin,
      Math.min(
        100 - margin,
        x
      )
    )

    y = Math.max(
      margin,
      Math.min(
        100 - margin,
        y
      )
    )

    targetPlayerRef.current = {
      x,
      y,
    }
  }

  /*
   * POINTER MOVE
   */
  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      !gameStartedRef.current ||
      gameOverRef.current
    ) {
      return
    }

    movePlayer(
      event.clientX,
      event.clientY
    )
  }

  /*
   * PLAYER COLLISION
   */
  const isPlayerHit = (
    enemy: Enemy,
    currentPlayer: Player,
    width: number,
    height: number
  ) => {
    const dx =
      (
        enemy.x -
        currentPlayer.x
      ) *
      width /
      100

    const dy =
      (
        enemy.y -
        currentPlayer.y
      ) *
      height /
      100

    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      )

    const collisionRadius =
      PLAYER_SIZE / 2 +
      enemy.size / 2

    return (
      distance <=
      collisionRadius
    )
  }

  /*
   * NEAR MISS
   */
  const isNearMiss = (
    enemy: Enemy,
    currentPlayer: Player,
    width: number,
    height: number
  ) => {
    if (
      enemy.nearMissTriggered
    ) {
      return false
    }

    const dx =
      (
        enemy.x -
        currentPlayer.x
      ) *
      width /
      100

    const dy =
      (
        enemy.y -
        currentPlayer.y
      ) *
      height /
      100

    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      )

    const collisionRadius =
      PLAYER_SIZE / 2 +
      enemy.size / 2

    return (
      distance >
        collisionRadius &&
      distance <
        collisionRadius +
          NEAR_MISS_DISTANCE
    )
  }

  /*
   * BALL ↔ BALL COLLISION
   */
  const resolveBallCollisions = (
    list: Enemy[],
    width: number,
    height: number
  ) => {
    for (
      let i = 0;
      i < list.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < list.length;
        j++
      ) {
        const a =
          list[i]

        const b =
          list[j]

        const dx =
          (
            b.x - a.x
          ) *
          width /
          100

        const dy =
          (
            b.y - a.y
          ) *
          height /
          100

        const distance =
          Math.sqrt(
            dx * dx +
              dy * dy
          )

        const minimumDistance =
          (
            a.size +
            b.size
          ) / 2

        /*
         * Not touching.
         */
        if (
          distance >=
          minimumDistance
        ) {
          continue
        }

        /*
         * Prevent NaN.
         */
        if (distance < 0.001) {
          continue
        }

        const nx =
          dx / distance

        const ny =
          dy / distance

        /*
         * Push them apart.
         */
        const overlap =
          minimumDistance -
          distance

        const separation =
          overlap / 2

        a.x -=
          nx *
          separation *
          100 /
          width

        a.y -=
          ny *
          separation *
          100 /
          height

        b.x +=
          nx *
          separation *
          100 /
          width

        b.y +=
          ny *
          separation *
          100 /
          height

        /*
         * Relative velocity.
         */
        const relativeVelocity =
          (
            b.vx -
            a.vx
          ) *
            nx +
          (
            b.vy -
            a.vy
          ) *
            ny

        /*
         * Only bounce if
         * moving toward each other.
         */
        if (
          relativeVelocity < 0
        ) {
          const impulse =
            -(
              1 +
              BALL_BOUNCE
            ) *
            relativeVelocity /
            2

          a.vx -=
            impulse * nx

          a.vy -=
            impulse * ny

          b.vx +=
            impulse * nx

          b.vy +=
            impulse * ny
        }
      }
    }
  }

  /*
   * SPAWN CONTROLLER
   *
   * This is intentionally
   * separate from the animation loop.
   */
  useEffect(() => {
    if (
      !gameStarted ||
      gameOver
    ) {
      return
    }

    const spawn = () => {
      if (
        !gameStartedRef.current ||
        gameOverRef.current
      ) {
        return
      }

      const desired =
        getDesiredEnemyCount()

      const current =
        enemiesRef.current.length

      if (
        current < desired &&
        current < MAX_ENEMIES
      ) {
        /*
         * Spawn one.
         */
        enemiesRef.current.push(
          createEnemy()
        )

        /*
         * Later game can spawn
         * a second ball at once.
         */
        const seconds =
          getElapsedSeconds()

        if (
          seconds > 18 &&
          Math.random() < 0.25 &&
          enemiesRef.current.length <
            desired
        ) {
          enemiesRef.current.push(
            createEnemy()
          )
        }
      }
    }

    spawnTimerRef.current =
      window.setInterval(
        spawn,
        SPAWN_CHECK_INTERVAL
      )

    return () => {
      if (
        spawnTimerRef.current !== null
      ) {
        clearInterval(
          spawnTimerRef.current
        )

        spawnTimerRef.current = null
      }
    }
  }, [
    gameStarted,
    gameOver,
  ])

  /*
   * MAIN GAME LOOP
   */
  useEffect(() => {
    if (
      !gameStarted ||
      gameOver
    ) {
      return
    }

    const animate = (
      currentTime: number
    ) => {
      if (
        !gameStartedRef.current ||
        gameOverRef.current
      ) {
        return
      }

      /*
       * Delta time.
       */
      if (
        lastFrameTimeRef.current ===
        null
      ) {
        lastFrameTimeRef.current =
          currentTime
      }

      const deltaTime =
        Math.min(
          (
            currentTime -
            lastFrameTimeRef.current
          ) / 1000,
          0.05
        )

      lastFrameTimeRef.current =
        currentTime

      /*
       * Arena.
       */
      const rect =
        gameAreaRef.current
          ?.getBoundingClientRect()

      const width =
        rect?.width ?? 800

      const height =
        rect?.height ?? 600

      /*
       * Time.
       */
      const seconds =
        (
          currentTime -
          gameStartTimeRef.current
        ) / 1000

      /*
       * SPEED INCREASE.
       */
      enemySpeedRef.current =
        getCurrentSpeed()

      /*
       * PLAYER.
       */
      const currentPlayer =
        playerRef.current

      const targetPlayer =
        targetPlayerRef.current

      const playerLerp =
        Math.min(
          1,
          deltaTime *
            PLAYER_LERP
        )

      currentPlayer.x +=
        (
          targetPlayer.x -
          currentPlayer.x
        ) *
        playerLerp

      currentPlayer.y +=
        (
          targetPlayer.y -
          currentPlayer.y
        ) *
        playerLerp

      /*
       * SURVIVAL TIME.
       */
      setSurvivalTime(
        Number(
          seconds.toFixed(1)
        )
      )

      /*
       * SCORE EVERY SECOND.
       */
      if (
        currentTime -
          lastScoreTimeRef.current >=
        SCORE_INTERVAL
      ) {
        const points =
          Math.floor(
            (
              currentTime -
              lastScoreTimeRef.current
            ) / 1000
          )

        scoreRef.current +=
          points

        setScore(
          scoreRef.current
        )

        lastScoreTimeRef.current =
          currentTime
      }

      /*
       * COMBO TIMEOUT.
       */
      if (
        comboRef.current > 0 &&
        currentTime -
          lastNearMissTimeRef.current >
          2600
      ) {
        comboRef.current = 0
        setCombo(0)
      }

      /*
       * UPDATE BALLS.
       */
      const updatedEnemies =
        enemiesRef.current.map(
          (enemy) => {
            const dx =
              currentPlayer.x -
              enemy.x

            const dy =
              currentPlayer.y -
              enemy.y

            const distance =
              Math.sqrt(
                dx * dx +
                  dy * dy
              ) || 1

            /*
             * NORMAL
             */
            if (
              enemy.type ===
              'normal'
            ) {
              const speed =
                enemySpeedRef.current

              const targetVX =
                (
                  dx /
                  distance
                ) *
                speed

              const targetVY =
                (
                  dy /
                  distance
                ) *
                speed

              const steering =
                Math.min(
                  1,
                  deltaTime * 2.8
                )

              enemy.vx +=
                (
                  targetVX -
                  enemy.vx
                ) *
                steering

              enemy.vy +=
                (
                  targetVY -
                  enemy.vy
                ) *
                steering
            }

            /*
             * FAST
             */
            if (
              enemy.type ===
              'fast'
            ) {
              const speed =
                enemySpeedRef.current *
                1.55

              const targetVX =
                (
                  dx /
                  distance
                ) *
                speed

              const targetVY =
                (
                  dy /
                  distance
                ) *
                speed

              const steering =
                Math.min(
                  1,
                  deltaTime * 4
                )

              enemy.vx +=
                (
                  targetVX -
                  enemy.vx
                ) *
                steering

              enemy.vy +=
                (
                  targetVY -
                  enemy.vy
                ) *
                steering
            }

            /*
             * STRAIGHT
             */
            if (
              enemy.type ===
              'straight'
            ) {
              const speed =
                Math.sqrt(
                  enemy.vx *
                    enemy.vx +
                  enemy.vy *
                    enemy.vy
                ) || 1

              const targetSpeed =
                enemySpeedRef.current *
                1.2

              enemy.vx =
                (
                  enemy.vx /
                  speed
                ) *
                targetSpeed

              enemy.vy =
                (
                  enemy.vy /
                  speed
                ) *
                targetSpeed
            }

            /*
             * HEAVY
             */
            if (
              enemy.type ===
              'heavy'
            ) {
              const speed =
                enemySpeedRef.current *
                0.68

              const targetVX =
                (
                  dx /
                  distance
                ) *
                speed

              const targetVY =
                (
                  dy /
                  distance
                ) *
                speed

              const steering =
                Math.min(
                  1,
                  deltaTime * 1.8
                )

              enemy.vx +=
                (
                  targetVX -
                  enemy.vx
                ) *
                steering

              enemy.vy +=
                (
                  targetVY -
                  enemy.vy
                ) *
                steering
            }

            /*
             * ZIGZAG
             */
            if (
              enemy.type ===
              'zigzag'
            ) {
              enemy.zigzagTimer -=
                deltaTime

              if (
                enemy.zigzagTimer <=
                0
              ) {
                enemy.zigzagTimer =
                  ZIGZAG_INTERVAL *
                  (
                    0.7 +
                    Math.random() *
                      0.5
                  )

                enemy.zigzagDirection *=
                  -1
              }

              const targetAngle =
                Math.atan2(
                  dy,
                  dx
                )

              const angle =
                targetAngle +
                enemy.zigzagDirection *
                  0.8

              const speed =
                enemySpeedRef.current *
                1.1

              const targetVX =
                Math.cos(angle) *
                speed

              const targetVY =
                Math.sin(angle) *
                speed

              const steering =
                Math.min(
                  1,
                  deltaTime * 3
                )

              enemy.vx +=
                (
                  targetVX -
                  enemy.vx
                ) *
                steering

              enemy.vy +=
                (
                  targetVY -
                  enemy.vy
                ) *
                steering
            }

            /*
             * LIMIT EXTREME VELOCITY.
             */
            const velocity =
              Math.sqrt(
                enemy.vx *
                  enemy.vx +
                enemy.vy *
                  enemy.vy
              ) || 1

            const maximum =
              enemySpeedRef.current *
              (
                enemy.type ===
                'fast'
                  ? 1.7
                  : 1.35
              )

            if (
              velocity >
              maximum
            ) {
              enemy.vx =
                (
                  enemy.vx /
                  velocity
                ) *
                maximum

              enemy.vy =
                (
                  enemy.vy /
                  velocity
                ) *
                maximum
            }

            /*
             * MOVE.
             *
             * vx/vy are pixels per second.
             */
            enemy.x +=
              enemy.vx *
              deltaTime *
              100 /
              width

            enemy.y +=
              enemy.vy *
              deltaTime *
              100 /
              height

            /*
             * KEEP BALLS INSIDE.
             *
             * They bounce from walls.
             */
            const radiusX =
              enemy.size *
              0.5 *
              100 /
              width

            const radiusY =
              enemy.size *
              0.5 *
              100 /
              height

            if (
              enemy.x <
              radiusX
            ) {
              enemy.x =
                radiusX

              enemy.vx =
                Math.abs(
                  enemy.vx
                )
            }

            if (
              enemy.x >
              100 -
                radiusX
            ) {
              enemy.x =
                100 -
                radiusX

              enemy.vx =
                -Math.abs(
                  enemy.vx
                )
            }

            if (
              enemy.y <
              radiusY
            ) {
              enemy.y =
                radiusY

              enemy.vy =
                Math.abs(
                  enemy.vy
                )
            }

            if (
              enemy.y >
              100 -
                radiusY
            ) {
              enemy.y =
                100 -
                radiusY

              enemy.vy =
                -Math.abs(
                  enemy.vy
                )
            }

            return enemy
          }
        )

      /*
       * BALL ↔ BALL PHYSICS
       */
      resolveBallCollisions(
        updatedEnemies,
        width,
        height
      )

      /*
       * NEAR MISS
       */
      for (
        const enemy of
        updatedEnemies
      ) {
        if (
          isNearMiss(
            enemy,
            currentPlayer,
            width,
            height
          )
        ) {
          enemy.nearMissTriggered =
            true

          nearMissesRef.current +=
            1

          comboRef.current +=
            1

          const bonus =
            3 +
            Math.min(
              comboRef.current,
              12
            )

          scoreRef.current +=
            bonus

          lastNearMissTimeRef.current =
            currentTime

          setNearMisses(
            nearMissesRef.current
          )

          setCombo(
            comboRef.current
          )

          setScore(
            scoreRef.current
          )

          playNearMissSound()
        }
      }

      /*
       * PLAYER COLLISION
       */
      const collision =
        updatedEnemies.some(
          (enemy) =>
            isPlayerHit(
              enemy,
              currentPlayer,
              width,
              height
            )
        )

      /*
       * SAVE REFS.
       */
      enemiesRef.current =
        updatedEnemies

      /*
       * GAME OVER.
       */
      if (collision) {
        gameStartedRef.current =
          false

        gameOverRef.current =
          true

        setGameStarted(false)
        setGameOver(true)

        setPlayer({
          ...currentPlayer,
        })

        setEnemies([
          ...updatedEnemies,
        ])

        playGameOverSound()

        const finalScore =
          scoreRef.current

        if (
          finalScore >
          bestScoreRef.current
        ) {
          bestScoreRef.current =
            finalScore

          setBestScore(
            finalScore
          )

          setIsNewBest(true)
        }

        return
      }

      /*
       * UPDATE UI.
       */
      setPlayer({
        ...currentPlayer,
      })

      setEnemies([
        ...updatedEnemies,
      ])

      /*
       * NEXT FRAME.
       */
      animationRef.current =
        requestAnimationFrame(
          animate
        )
    }

    animationRef.current =
      requestAnimationFrame(
        animate
      )

    return () => {
      if (
        animationRef.current !== null
      ) {
        cancelAnimationFrame(
          animationRef.current
        )

        animationRef.current = null
      }
    }
  }, [
    gameStarted,
    gameOver,
  ])

  const isPlaying =
    gameStarted &&
    !gameOver

  return (
    <main className="min-h-screen bg-[#08090D] text-white">

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-5 sm:py-8">

        {/* HEADER */}
        <header className="mb-5 flex items-center gap-3">

          <button
            onClick={() =>
              navigate('/')
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="بازگشت"
          >
            <ArrowRight size={20} />
          </button>

          <div>
            <h1 className="text-xl font-black sm:text-2xl">
              فرار کن
            </h1>

            <p className="text-xs text-zinc-500">
              هر ثانیه سخت‌تر میشه
            </p>
          </div>

        </header>

        {/* START */}
        {!isPlaying &&
          !gameOver && (
            <section className="flex flex-1 items-center justify-center">

              <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 text-center shadow-2xl sm:p-9">

                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
                  <Shield
                    size={40}
                    strokeWidth={1.7}
                  />
                </div>

                <h2 className="text-3xl font-black">
                  فرار کن
                </h2>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                  توپ‌ها از همه طرف وارد میشن.
                  به هم برخورد می‌کنن،
                  از دیوار برمی‌گردن و
                  هر لحظه سریع‌تر میشن.
                  فقط جاخالی بده و زنده بمون.
                </p>

                <div className="mt-7 grid grid-cols-2 gap-2">

                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-xs text-zinc-500">
                      سختی
                    </p>

                    <p className="mt-1 font-bold">
                      بی‌رحمانه
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-xs text-zinc-500">
                      دشمن
                    </p>

                    <p className="mt-1 font-bold">
                      تا ۳۰ توپ
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

        {/* GAME */}
        {isPlaying && (
          <section className="flex flex-1 flex-col">

            {/* STATS */}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">

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

                <p className="mt-1 text-xl font-black sm:text-2xl">
                  {survivalTime.toFixed(1)}
                </p>
              </div>

            </div>

            {/* ARENA */}
            <div
              ref={gameAreaRef}
              onPointerMove={
                handlePointerMove
              }
              onPointerDown={(event) => {
                movePlayer(
                  event.clientX,
                  event.clientY
                )
              }}
              className="relative min-h-[500px] flex-1 touch-none cursor-crosshair overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] shadow-inner sm:min-h-[600px]"
            >

              {/* GRID */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                  backgroundSize:
                    '40px 40px',
                }}
              />

              {/* BORDER */}
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_0_120px_rgba(255,255,255,0.06)]" />

              {/* PLAYER GLOW */}
              <div
                className="pointer-events-none absolute rounded-full bg-white/10 blur-xl"
                style={{
                  width:
                    PLAYER_SIZE * 3,

                  height:
                    PLAYER_SIZE * 3,

                  left:
                    `${player.x}%`,

                  top:
                    `${player.y}%`,

                  transform:
                    'translate(-50%, -50%)',
                }}
              />

              {/* PLAYER */}
              <div
                className="pointer-events-none absolute rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.55)]"
                style={{
                  width:
                    PLAYER_SIZE,

                  height:
                    PLAYER_SIZE,

                  left:
                    `${player.x}%`,

                  top:
                    `${player.y}%`,

                  transform:
                    'translate(-50%, -50%)',
                }}
              />

              {/* ENEMIES */}
              {enemies.map(
                (enemy) => (
                  <div
                    key={enemy.id}
                    className={[
                      'pointer-events-none absolute rounded-full border',
                      enemy.type ===
                      'fast'
                        ? 'border-white/80 bg-white/45 shadow-[0_0_28px_rgba(255,255,255,0.38)]'
                        : enemy.type ===
                          'straight'
                        ? 'border-white/60 bg-white/25 shadow-[0_0_22px_rgba(255,255,255,0.25)]'
                        : enemy.type ===
                          'heavy'
                        ? 'border-white/90 bg-white/50 shadow-[0_0_35px_rgba(255,255,255,0.42)]'
                        : enemy.type ===
                          'zigzag'
                        ? 'border-white/75 bg-white/30 shadow-[0_0_26px_rgba(255,255,255,0.32)]'
                        : 'border-white/30 bg-white/20 shadow-[0_0_16px_rgba(255,255,255,0.14)]',
                    ].join(' ')}
                    style={{
                      width:
                        enemy.size,

                      height:
                        enemy.size,

                      left:
                        `${enemy.x}%`,

                      top:
                        `${enemy.y}%`,

                      transform:
                        'translate(-50%, -50%)',
                    }}
                  />
                )
              )}

              {/* INSTRUCTION */}
              <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/5 bg-black/30 px-4 py-2 text-xs text-zinc-600 backdrop-blur-sm">
                حرکت بده و زنده بمون
              </div>

            </div>

          </section>
        )}

        {/* GAME OVER */}
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
                گیر افتادی
              </p>

              <h2 className="mt-2 text-6xl font-black">
                {score}
              </h2>

              <p className="mt-2 text-zinc-400">
                امتیاز
              </p>

              {isNewBest && (
                <p className="mt-4 text-sm font-bold">
                  رکورد جدید!
                </p>
              )}

              <div className="mt-5 space-y-2 text-sm text-zinc-500">

                <div>
                  زمان بقا:{' '}
                  <span className="text-zinc-300">
                    {survivalTime.toFixed(1)}
                  </span>
                </div>

                <div>
                  نزدیک‌ها:{' '}
                  <span className="text-zinc-300">
                    {nearMisses}
                  </span>
                </div>

              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-zinc-500">
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

export default DodgeGame