
import {
  ArrowLeft,
  Heart,
  Play,
  Target,
  Gamepad2,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  const openReflexGame = () => {
    navigate('/reflex')
  }

  return (
    <main className="min-h-screen bg-[#08090D] text-white">
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

              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">
                <Target size={14} />
                اولین بازی آماده است
              </div>

              {/* Title */}
              <h2 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                سرعتت رو
                <br />
                به چالش بکش.
              </h2>

              {/* Description */}
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                بازی‌های سریع و ساده برای اینکه رکورد خودت رو بشکنی
                و ببینی چقدر می‌تونی بهتر بشی.
              </p>

              {/* Play button */}
              <button
                onClick={openReflexGame}
                className="mt-7 flex items-center gap-2 rounded-2xl bg-white px-6 py-4 font-bold text-black transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play
                  size={18}
                  fill="currentColor"
                />

                بازی رفلکس

                <ArrowLeft size={18} />
              </button>

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

            <span className="text-xs text-zinc-600">
              ۱ بازی
            </span>

          </div>

          {/* Game cards */}
          <div className="grid gap-3 sm:grid-cols-2">

            {/* Reflex */}
            <button
              onClick={openReflexGame}
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-right transition hover:border-white/20 hover:bg-white/[0.07]"
            >

              {/* Icon */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 transition group-hover:bg-white/15">
                <Target size={27} />
              </div>

              {/* Content */}
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

            {/* Coming Soon */}
            <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-5 opacity-50">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                <Gamepad2 size={27} />
              </div>

              <div>

                <h4 className="font-bold">
                  بازی بعدی
                </h4>

                <p className="mt-1 text-xs text-zinc-600">
                  به‌زودی
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* Support */}
        <section className="mt-10">

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">

            <div className="flex items-start gap-4">

              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5">
                <Heart size={20} />
              </div>

              {/* Content */}
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

