import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('envoy-theme') || 'system')

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    let resolved = theme
    if (theme === 'system') {
      resolved = systemDark ? 'dark' : 'light'
    }

    if (resolved === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }

    localStorage.setItem('envoy-theme', theme)
  }, [theme])

  return { theme, setTheme }
}