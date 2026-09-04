import { useEffect } from 'react'

function GlobalButtonSound() {
  useEffect(() => {
    const handleButtonClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      const button = target.closest('button')

      if (!button) {
        return
      }

      // The Reflex target has its own hit sound
      if (button.getAttribute('aria-label') === 'هدف') {
        return
      }

      const audio = new Audio('/sounds/click.wav')
      audio.volume = 0.3

      audio.play().catch(() => {
        // Ignore browser audio errors
      })
    }

    document.addEventListener('click', handleButtonClick)

    return () => {
      document.removeEventListener('click', handleButtonClick)
    }
  }, [])

  return null
}

export default GlobalButtonSound

