import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#111827',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        },
        success: {
          iconTheme: { primary: '#16a34a', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  )
}
