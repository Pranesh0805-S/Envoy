import { useEffect } from 'react'
import FloatingAvatar from '../components/avatar/FloatingAvatar'

function AvatarWidget() {
  useEffect(() => {
    const root = document.documentElement
    const prevBodyBg = document.body.style.background
    const prevHtmlBg = root.style.background
    const prevColorScheme = root.style.colorScheme

    document.body.style.background = 'transparent'
    root.style.background = 'transparent'
    root.style.colorScheme = 'light' // <- key addition, kills the dark canvas fallback

    return () => {
      document.body.style.background = prevBodyBg
      root.style.background = prevHtmlBg
      root.style.colorScheme = prevColorScheme
    }
  }, [])

  return (
    <div
      id="avatar-widget-root"
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <FloatingAvatar />
    </div>
  )
}

export default AvatarWidget