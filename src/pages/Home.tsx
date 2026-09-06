import { useEffect, useState } from 'react'

import {
  ArrowLeft,
  Heart,
  Target,
  Gamepad2,
  Layers,
  Shield,
  Grid2X2,
  CircleDot,
  Box,
  X
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

type User = {
  id: number
  username: string
}

const DEVICE_TOKEN_KEY = 'reflex-games-device-token'

function Home() {
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState('')

  const apiUrl = import.meta.env.VITE_API_URL

  const openReflexGame = () => {
    navigate('/reflex')
  }

  const openStackGame = () => {
    navigate('/stack')
  }

  const openDodgeGame = () => {
    navigate('/dodge')
  }

  const openFlappyGame = () => {
    navigate('/flappy')
  }

  const open2048Game = () => {
    navigate('/2048')
  }

  const openSnakeGame = () => {
    navigate('/snake')
  }

  const openTetrisGame = () => {
    navigate('/tetris')
  }

  /*
  |--------------------------------------------------------------------------
  | Open username modal
  |--------------------------------------------------------------------------
  */

  const openUsernameModal = () => {
    if (!user) return

    setNewUsername(user.username)
    setUsernameError('')
    setShowUsernameModal(true)
  }

  /*
  |--------------------------------------------------------------------------
  | Close username modal
  |--------------------------------------------------------------------------
  */

  const closeUsernameModal = () => {
    if (savingUsername) return

    setShowUsernameModal(false)
    setUsernameError('')
  }

  /*
  |--------------------------------------------------------------------------
  | Load / create user
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const initializeUser = async () => {
      try {
        let deviceToken = localStorage.getItem(
          DEVICE_TOKEN_KEY
        )

        if (!deviceToken) {
          deviceToken = crypto.randomUUID()

          localStorage.setItem(
            DEVICE_TOKEN_KEY,
            deviceToken
          )
        }

        const response = await fetch(
          `${apiUrl}/index.php?route=user`,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              device_token: deviceToken
            })
          }
        )

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status}`
          )
        }

        const data = await response.json()

        if (!data.success || !data.user) {
          throw new Error(
            data.message || 'Failed to load user.'
          )
        }

        setUser(data.user)

      } catch (error) {
        console.error(
          'Failed to initialize user:',
          error
        )
      } finally {
        setLoadingUser(false)
      }
    }

    initializeUser()
  }, [apiUrl])

  /*
  |--------------------------------------------------------------------------
  | Save username
  |--------------------------------------------------------------------------
  */

  const saveUsername = async () => {
    if (!user) return

    const username = newUsername.trim()

    /*
    |--------------------------------------------------------------------------
    | Client-side validation
    |--------------------------------------------------------------------------
    */

    if (username.length < 2) {
      setUsernameError(
        'نام کاربری باید حداقل ۲ کاراکتر باشد.'
      )

      return
    }

    if (username.length > 32) {
      setUsernameError(
        'نام کاربری نمی‌تواند بیشتر از ۳۲ کاراکتر باشد.'
      )

      return
    }

    try {
      setSavingUsername(true)
      setUsernameError('')

      const deviceToken = localStorage.getItem(
        DEVICE_TOKEN_KEY
      )

      if (!deviceToken) {
        throw new Error(
          'Device token not found.'
        )
      }

      const response = await fetch(
        `${apiUrl}/index.php?route=username`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            device_token: deviceToken,
            username
          })
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          'Failed to update username.'
        )
      }

      /*
      |--------------------------------------------------------------------------
      | Update local user
      |--------------------------------------------------------------------------
      */

      setUser(data.user)

      /*
      |--------------------------------------------------------------------------
      | Close modal
      |--------------------------------------------------------------------------
      */

      setShowUsernameModal(false)

    } catch (error) {
      console.error(
        'Failed to update username:',
        error
      )

      setUsernameError(
        error instanceof Error
          ? error.message
          : 'خطایی رخ داد.'
      )

    } finally {
      setSavingUsername(false)
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#08090D] text-white"
    >
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-5 sm:py-8">

        {/* Header */}
        <header className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <Gamepad2
                size={21}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h1 className="text-lg font-black">
                رفلکس گیمز
              </h1>

              <p className="text-[11px] text-zinc-500">
                بازی‌های کوتاه، رقابت‌های بزرگ
              </p>
            </div>

          </div>

          {/* User */}
          <button
            type="button"
            onClick={openUsernameModal}
            disabled={loadingUser || !user}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold transition hover:border-white/20 hover:bg-white/[0.07] disabled:cursor-default disabled:opacity-60"
          >
            {loadingUser
              ? 'در حال بارگذاری...'
              : user?.username ?? 'Player'}
          </button>

        </header>

        {/* Hero */}
        <section className="mt-8">

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 sm:p-10">

            {/* Decorative circles */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-white/[0.025]" />

            <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-white/[0.025]" />

            <div className="relative">

              {/* Title */}
              <h2 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                رکوردت رو
                <br />
                به چالش بکش.
              </h2>

              {/* Description */}
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                بازی‌های سریع و ساده برای اینکه رکورد خودت رو بشکنی
                و ببینی چقدر می‌تونی بهتر بشی.
              </p>

            </div>

          </div>

        </section>

        {/* Games */}
        <section className="mt-10">

          {/* Section header */}
          <div className="mb-4 flex items-end justify-between">

            <div>
              <h3 className="text-xl font-black">
                بازی‌ها
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                یکی رو انتخاب کن و شروع کن
              </p>
            </div>

          </div>

          {/* Game cards */}
          <div className="grid gap-3 sm:grid-cols-2">

            {/* Reflex */}
            <button
              onClick={openReflexGame}
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-right transition hover:border-white/20 hover:bg-white/[0.07]"
            >

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 transition group-hover:bg-white/15">
                <Target size={27} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">

                  <h4 className="font-bold">
                    رفلکس
                  </h4>

                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />

                </div>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  هدف رو پیدا کن و سریع کلیک کن.
                  اشتباه کنی، بازی تمومه.
                </p>

              </div>

            </button>

            {/* Stack */}
            <button
              onClick={openStackGame}
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-right transition hover:border-white/20 hover:bg-white/[0.07]"
            >

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 transition group-hover:bg-white/15">
                <Layers size={27} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">

                  <h4 className="font-bold">
                    برج‌سازی
                  </h4>

                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />

                </div>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  بلوک‌ها رو روی هم بچین و بلندترین برج رو بساز.
                </p>

              </div>

            </button>

            {/* Dodge */}
            <button
              onClick={openDodgeGame}
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-right transition hover:border-white/20 hover:bg-white/[0.07]"
            >

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 transition group-hover:bg-white/15">
                <Shield size={27} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">

                  <h4 className="font-bold">
                    فرار کن
                  </h4>

                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />

                </div>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  از دشمن‌ها فرار کن و تا جای ممکن زنده بمون.
                </p>

              </div>

            </button>

            {/* Flappy Bird */}
            <button
              onClick={openFlappyGame}
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-right transition hover:border-white/20 hover:bg-white/[0.07]"
            >

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 transition group-hover:bg-white/15">

                <div className="relative h-7 w-7">

                  <div className="absolute left-1 top-1 h-5 w-5 rounded-[7px] bg-white" />

                  <div className="absolute left-5 top-2 h-1.5 w-2.5 rounded-full bg-zinc-400" />

                  <div className="absolute left-5 top-0.5 h-1.5 w-1.5 rounded-full bg-black" />

                  <div className="absolute left-0 top-4 h-2 w-3 rounded-full bg-zinc-300" />

                </div>

              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">

                  <h4 className="font-bold">
                    فلاپی برد
                  </h4>

                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />

                </div>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  پرواز کن، از لوله‌ها رد شو و رکوردت رو بشکن.
                </p>

              </div>

            </button>

            {/* 2048 */}
            <button
              onClick={open2048Game}
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-right transition hover:border-white/20 hover:bg-white/[0.07]"
            >

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 transition group-hover:bg-white/[0.15]">
                <Grid2X2 size={27} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">

                  <h4 className="font-bold">
                    ۲۰۴۸
                  </h4>

                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />

                </div>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  عددها رو ترکیب کن، به ۲۰۴۸ برس و رکوردت رو بشکن.
                </p>

              </div>

            </button>

            {/* Snake */}
            <button
              onClick={openSnakeGame}
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-right transition hover:border-white/20 hover:bg-white/[0.07]"
            >

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 transition group-hover:bg-white/15">
                <CircleDot size={27} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">

                  <h4 className="font-bold">
                    مار
                  </h4>

                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />

                </div>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  غذاها رو بخور، بزرگ‌تر شو و رکوردت رو بشکن.
                </p>

              </div>

            </button>

            {/* Tetris */}
            <button
              onClick={openTetrisGame}
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-right transition hover:border-white/20 hover:bg-white/[0.07]"
            >

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 transition group-hover:bg-white/15">
                <Box size={27} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">

                  <h4 className="font-bold">
                    تتریس
                  </h4>

                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />

                </div>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  بلوک‌ها رو بچین، خط‌ها رو پاک کن و رکوردت رو بشکن.
                </p>

              </div>

            </button>

          </div>

        </section>

        {/* Support */}
        <section className="mt-10">

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5">
                <Heart size={20} />
              </div>

              <div className="flex-1">

                <h3 className="font-bold">
                  از رفلکس گیمز حمایت کن
                </h3>

                <p className="mt-1 text-xs leading-6 text-zinc-500">
                  این پروژه رایگانه و با حمایت شما می‌تونه
                  بازی‌های بیشتری داشته باشه.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* Footer */}
        <footer className="py-10 text-center">

          <p className="text-xs text-zinc-700">
            رفلکس گیمز
          </p>

        </footer>

      </div>

      {/* Username Modal */}
      {showUsernameModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeUsernameModal()
            }
          }}
        >

          <div
            dir="rtl"
            className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-[#111217] p-6 shadow-2xl"
          >

            {/* Modal Header */}
            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-lg font-black">
                  تغییر نام کاربری
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  نامی که بقیه بازیکن‌ها می‌بینند.
                </p>

              </div>

              <button
                type="button"
                onClick={closeUsernameModal}
                disabled={savingUsername}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>

            </div>

            {/* Input */}
            <div className="mt-6">

              <label
                htmlFor="username"
                className="mb-2 block text-xs font-bold text-zinc-400"
              >
                نام کاربری
              </label>

              <input
                id="username"
                type="text"
                value={newUsername}
                onChange={(event) => {
                  setNewUsername(event.target.value)
                  setUsernameError('')
                }}
                onKeyDown={(event) => {

                  if (event.key === 'Enter') {
                    saveUsername()
                  }

                  if (event.key === 'Escape') {
                    closeUsernameModal()
                  }

                }}
                maxLength={32}
                autoFocus
                disabled={savingUsername}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-white/25 focus:bg-white/[0.06] disabled:opacity-50"
                placeholder="نام کاربری"
              />

              <div className="mt-2 flex items-center justify-between">

                <span className="text-[11px] text-zinc-600">
                  ۲ تا ۳۲ کاراکتر
                </span>

                <span className="text-[11px] text-zinc-600">
                  {newUsername.length}/32
                </span>

              </div>

              {/* Error */}
              {usernameError && (
                <p className="mt-3 text-xs text-red-400">
                  {usernameError}
                </p>
              )}

            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={closeUsernameModal}
                disabled={savingUsername}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={saveUsername}
                disabled={
                  savingUsername ||
                  newUsername.trim().length < 2
                }
                className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingUsername
                  ? 'در حال ذخیره...'
                  : 'ذخیره'}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  )
}

export default Home