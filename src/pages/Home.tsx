import { useEffect, useState, useCallback, useRef } from 'react'
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
  X,
  ExternalLink,
  Sparkles,
  WifiOff,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type User = {
  id: number
  username: string
}

const DEVICE_TOKEN_KEY = 'reflex-games-device-token'
const DONATION_URL = 'https://daramet.com/Nuvrix'

function Home() {
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState('')

  // وضعیت اتصال اینترنت
  const [isOnline, setIsOnline] = useState(true)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL

  const openReflexGame = () => navigate('/reflex')
  const openStackGame = () => navigate('/stack')
  const openDodgeGame = () => navigate('/dodge')
  const openFlappyGame = () => navigate('/flappy')
  const open2048Game = () => navigate('/2048')
  const openSnakeGame = () => navigate('/snake')
  const openTetrisGame = () => navigate('/tetris')

  /*
  |--------------------------------------------------------------------------
  | بررسی دقیق وضعیت اتصال اینترنت (حتی روی لوکال‌هاست)
  |--------------------------------------------------------------------------
  */
  const checkInternetConnection = useCallback(async () => {
    // ۱. بررسی مقدماتی مرورگر
    if (!navigator.onLine) {
      setIsOnline(false)
      return false
    }

    try {
      setIsCheckingNetwork(true)

      // ۲. پینگ به یک آدرس سبک و بدون کش با تایم‌اوت ۲.۵ ثانیه
      // استفاده از mode: 'no-cors' برای جلوگیری از خطای CORS در بررسی اتصال خارجی
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2500)

      await fetch('https://www.google.com/generate_204', {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      setIsOnline(true)
      return true
    } catch {
      // اگر نتوانست به اینترنت وصل شود
      setIsOnline(false)
      return false
    } finally {
      setIsCheckingNetwork(false)
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | لیسنرهای تغییر وضعیت شبکه (قطع و وصل شدن در لحظه)
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    // بررسی وضعیت اولیه
    checkInternetConnection()

    const handleOffline = () => {
      setIsOnline(false)
    }

    const handleOnline = () => {
      checkInternetConnection()
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // بررسی دوره‌ای هر ۵ ثانیه برای اطمینان صد در صدی
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        setIsOnline(false)
      }
    }, 5000)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      clearInterval(interval)
    }
  }, [checkInternetConnection])

  /*
  |--------------------------------------------------------------------------
  | بارگذاری و ایجاد کاربر اولیه
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const initializeUser = async () => {
      try {
        let deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY)

        if (!deviceToken) {
          deviceToken = crypto.randomUUID()
          localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken)
        }

        const response = await fetch(`${apiUrl}/index.php?route=user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_token: deviceToken,
          }),
        })

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()

        if (!data.success || !data.user) {
          throw new Error(data.message || 'Failed to load user.')
        }

        setUser(data.user)
      } catch (error) {
        console.error('Failed to initialize user:', error)
      } finally {
        setLoadingUser(false)
      }
    }

    initializeUser()
  }, [apiUrl])

  /*
  |--------------------------------------------------------------------------
  | مدیریت نام کاربری
  |--------------------------------------------------------------------------
  */
  const openUsernameModal = () => {
    if (!user) return
    setNewUsername(user.username)
    setUsernameError('')
    setShowUsernameModal(true)
  }

  const closeUsernameModal = () => {
    if (savingUsername) return
    setShowUsernameModal(false)
    setUsernameError('')
  }

  const saveUsername = async () => {
    if (!user) return
    const username = newUsername.trim()

    if (username.length < 2) {
      setUsernameError('نام کاربری باید حداقل ۲ کاراکتر باشد.')
      return
    }

    if (username.length > 32) {
      setUsernameError('نام کاربری نمی‌تواند بیشتر از ۳۲ کاراکتر باشد.')
      return
    }

    try {
      setSavingUsername(true)
      setUsernameError('')

      const deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY)
      if (!deviceToken) {
        throw new Error('Device token not found.')
      }

      const response = await fetch(`${apiUrl}/index.php?route=username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_token: deviceToken,
          username,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update username.')
      }

      setUser(data.user)
      setShowUsernameModal(false)
    } catch (error) {
      console.error('Failed to update username:', error)
      setUsernameError(
        error instanceof Error ? error.message : 'خطایی رخ داد.',
      )
    } finally {
      setSavingUsername(false)
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#08090D] text-white">
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-5 sm:py-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* آیکون دسته بازی اورجینال */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-lg transition">
              <Gamepad2 size={24} strokeWidth={2.2} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight sm:text-xl">
                  اسکور باکس
                </h1>
                <span className="rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300">
                  ScoreBox
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                مینی‌گیم‌های رکوردی و رقابت آنلاین
              </p>
            </div>
          </div>

          {/* User Profile */}
          <button
            type="button"
            onClick={openUsernameModal}
            disabled={loadingUser || !user}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
          >
            {loadingUser ? 'در حال بارگذاری...' : user?.username ?? 'بازیکن'}
          </button>
        </header>

        {/* Hero Section */}
        <section className="mt-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 sm:p-10 shadow-2xl">
            <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-white/[0.03] blur-xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-white/[0.03] blur-xl" />

            <div className="relative">
              {/* نشان سازنده - تیم نورویکس */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                <Sparkles size={14} className="text-amber-400" />
                <span>
                  توسعه داده شده توسط تیم <strong>نورویکس (Nurvix)</strong>
                </span>
              </div>

              {/* عنوان اصلی پلتفرم */}
              <h2 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                بیشترین رکورد رو
                <br />
                به اسمت ثبت کن.
              </h2>

              {/* توضیحات */}
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                مجموعه مینی‌گیم‌های سرعتی و مهارتی که برای محک زدن تمرکز و دقت شما توسط تیم <strong>نورویکس</strong> ساخته شده است. امتیاز کسب کنید، در لیدربورد بالا بروید و رکوردها را جابجا کنید.
              </p>
            </div>
          </div>
        </section>

        {/* Games Section */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-xl font-black">انتخاب بازی</h3>
              <p className="mt-1 text-xs text-zinc-500">
                یک چالش را انتخاب کنید و رکورد بزنید
              </p>
            </div>
          </div>

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
                  <h4 className="font-bold">رفلکس</h4>
                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  سرعت واکنش به اهداف متحرک در ۳۰ ثانیه.
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
                  <h4 className="font-bold">برج‌سازی</h4>
                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  چیدن دقیق بلوک‌ها و ساخت بلندترین برج.
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
                  <h4 className="font-bold">فرار کن</h4>
                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  جاخالی دادن به رگبار گلوله‌های مهاجم و بقا.
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
                  <h4 className="font-bold">فلاپی برد</h4>
                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  کنترل پرنده، رد شدن از موانع لوله‌ای و رکوردزنی.
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
                  <h4 className="font-bold">۲۰۴۸</h4>
                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  ترکیب اعداد، تفکر استراتژیک و دستیابی به کاشی‌های بالاتر.
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
                  <h4 className="font-bold">مار (Snake)</h4>
                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  جمع‌آوری غذاها، بزرگ‌تر شدن مار و بقا بدون برخورد.
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
                  <h4 className="font-bold">تتریس</h4>
                  <ArrowLeft
                    size={17}
                    className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-white"
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  مرتب‌سازی مهره‌ها، پاکسازی سطرها و رکوردزنی بی‌پایان.
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Support Section (Donation via Daramet) */}
        <section className="mt-10">
          <div className="rounded-[1.8rem] border border-rose-500/20 bg-gradient-to-r from-rose-500/[0.06] to-transparent p-6 sm:p-7">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                  <Heart size={24} className="fill-rose-500/20" />
                </div>
                <div>
                  <h3 className="text-base font-black sm:text-lg">
                    حمایت از تیم نورویکس (Nurvix)
                  </h3>
                  <p className="mt-1 max-w-xl text-xs leading-6 text-zinc-400 sm:text-sm">
                    این بازی‌ها توسط تیم <strong>نورویکس</strong> کاملاً رایگان و بدون تبلیغات تولید شده‌اند. با حمایت مالی در دارامت به رشد بازی‌ها و ارتقای سرورها کمک کنید.
                  </p>
                </div>
              </div>

              {/* دکمه دونیت دارامت */}
              <a
                href={DONATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/20 px-6 py-3.5 text-xs font-black text-rose-300 shadow-lg transition hover:bg-rose-500 hover:text-white sm:w-auto"
              >
                <Heart size={16} className="fill-current" />
                حمایت در دارامت
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-center">
          <p className="text-xs text-zinc-500">
            توسعه داده شده با ❤️ توسط تیم <strong className="text-zinc-300">نورویکس (Nurvix)</strong>
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">
            تمامی حقوق محفوظ است © {new Date().getFullYear()} Nurvix
          </p>
        </footer>

      </div>

      {/* ⚠️ مودال سراسری قطع اینترنت همراه با دکمه تلاش مجدد */}
      {!isOnline && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none"
        >
          <div className="w-full max-w-sm rounded-[2rem] border border-red-500/25 bg-[#0E0F15] p-6 text-center shadow-[0_0_60px_rgba(239,68,68,0.18)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <WifiOff size={32} strokeWidth={1.8} />
            </div>

            <h3 className="text-lg font-black text-white sm:text-xl">
              اتصال اینترنت برقرار نیست
            </h3>

            <p className="mt-2 text-xs leading-6 text-zinc-400 sm:text-sm">
              لطفاً اتصال اینترنت خود را بررسی کنید. برای ثبت امتیازات و ارتباط با سرور، دسترسی به اینترنت الزامی است.
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs text-zinc-500">
              <AlertCircle size={15} className="text-amber-400 shrink-0" />
              <span>ارتباط با شبکه اینترنت قطع شده است</span>
            </div>

            <button
              type="button"
              onClick={checkInternetConnection}
              disabled={isCheckingNetwork}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-black transition hover:bg-zinc-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={`shrink-0 ${isCheckingNetwork ? 'animate-spin' : ''}`}
              />
              {isCheckingNetwork ? 'در حال بررسی اتصال...' : 'تلاش مجدد'}
            </button>
          </div>
        </div>
      )}

      {/* Username Modal */}
      {showUsernameModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeUsernameModal()
            }
          }}
        >
          <div
            dir="rtl"
            className="w-full max-w-md rounded-[1.8rem] border border-white/10 bg-[#111217] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">تغییر نام کاربری</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  این نام در جدول لیدربورد بازی‌ها نمایش داده می‌شود.
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

            <div className="mt-6">
              <label
                htmlFor="username"
                className="mb-2 block text-xs font-bold text-zinc-400"
              >
                نام کاربری جدید
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
                  if (event.key === 'Enter') saveUsername()
                  if (event.key === 'Escape') closeUsernameModal()
                }}
                maxLength={32}
                autoFocus
                disabled={savingUsername}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-white/25 focus:bg-white/[0.07] disabled:opacity-50"
                placeholder="نام کاربری"
              />

              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-zinc-600">۲ تا ۳۲ کاراکتر</span>
                <span className="text-[11px] text-zinc-600">
                  {newUsername.length}/32
                </span>
              </div>

              {usernameError && (
                <p className="mt-3 text-xs text-red-400">{usernameError}</p>
              )}
            </div>

            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={closeUsernameModal}
                disabled={savingUsername}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-bold text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={saveUsername}
                disabled={savingUsername || newUsername.trim().length < 2}
                className="flex-1 rounded-xl bg-white px-4 py-3 text-xs font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingUsername ? 'در حال ذخیره...' : 'ذخیره نام'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Home