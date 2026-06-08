import React from 'react'
import { hydrateRoot, createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')!

// react-snap prerenders static HTML into #root at build time. Hydrate it when
// present; otherwise mount fresh (normal dev / non-prerendered routes).
if (container.hasChildNodes()) {
  hydrateRoot(
    container,
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
