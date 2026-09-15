import { useEffect, useState, useCallback } from 'react'
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react'

export function NetworkHandler() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const apiUrl = import.meta.env.VITE_API_URL

  /*
   * بررسی واقعی اتصال با ارسال درخواست سبک به سرور
   */
  const verifyConnection = useCallback(async () => {
    setIsChecking(true)

    // بررسی اولیه مرورگر
    if (!navigator.onLine) {
      setIsOnline(false)
      setIsChecking(false)
      return
    }

    try {
      // ارسال یک درخواست سریع به سرور برای اطمینان از دسترسی واقعی به اینترنت
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const response = await fetch(`${apiUrl}/index.php?t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // اگر پاسخی دریافت شد، یعنی اینترنت متصل است
      if (response.ok || response.status < 500) {
        setIsOnline(true)
      } else {
        setIsOnline(false)
      }
    } catch {
      // در صورت خطا در شبکه
      setIsOnline(false)
    } finally {
      setIsChecking(false)
    }
  }, [apiUrl])

  useEffect(() => {
    const handleOnline = () => {
      // مرورگر وصل شدن را حس کرد؛ بررسی نهایی با سرور
      verifyConnection()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // بررسی اولیه در زمان لود
    if (!navigator.onLine) {
      setIsOnline(false)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [verifyConnection])

  // اگر اینترنت متصل است، چیزی نمایش داده نمی‌شود
  if (isOnline) {
    return null
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none"
    >
      <div className="w-full max-w-sm rounded-[2rem] border border-red-500/20 bg-[#0E0F15] p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in-95 duration-200">
        
        {/* آیکون هشدار قطع اینترنت */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
          <WifiOff size={32} strokeWidth={1.8} />
        </div>

        {/* عنوان */}
        <h3 className="text-lg font-black text-white sm:text-xl">
          اتصال اینترنت برقرار نیست
        </h3>

        {/* متن هشدار */}
        <p className="mt-2 text-xs leading-6 text-zinc-400 sm:text-sm">
          لطفاً اتصال اینترنت خود را بررسی کنید. برای ثبت رکوردها، نمایش لیدربورد و ادامه بازی، دسترسی به اینترنت الزامی است.
        </p>

        {/* جعبه وضعیت */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs text-zinc-500">
          <AlertCircle size={15} className="text-amber-400 shrink-0" />
          <span>ارتباط با سرور قطع شده است</span>
        </div>

        {/* دکمه تلاش مجدد */}
        <button
          type="button"
          onClick={verifyConnection}
          disabled={isChecking}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-black transition hover:bg-zinc-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={`shrink-0 ${isChecking ? 'animate-spin' : ''}`}
          />
          {isChecking ? 'در حال بررسی اتصال...' : 'تلاش مجدد'}
        </button>

      </div>
    </div>
  )
}

export default NetworkHandler