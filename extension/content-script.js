(function () {
  if (document.getElementById('envoy-avatar-frame')) return

  const iframe = document.createElement('iframe')
  iframe.id = 'envoy-avatar-frame'
  iframe.src = 'http://localhost:5173/avatar-widget'
  iframe.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 420px;
    height: 620px;
    border: none;
    z-index: 999999;
    background: transparent;
    pointer-events: none;
  `
  document.body.appendChild(iframe)

  // Allow pointer events only on the visible avatar/chat area, not the whole transparent iframe box
  iframe.onload = () => {
    iframe.style.pointerEvents = 'auto'
  }
})()