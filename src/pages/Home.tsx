import {
  ArrowLeft,
  Heart,
  Play,
  Target,
  Gamepad2,
  Layers,
  Shield,
  Grid2X2,
  CircleDot,
  Box
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

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

  const openTetrisGame = () => navigate('/tetris')

  

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
    </main>
  )
}

export default Home