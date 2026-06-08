import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { useSeoMeta } from '../useSeoMeta'

function Harness() {
  return useSeoMeta({ title: 'Test Title', description: 'Test description', canonicalPath: '/listings' })
}

describe('useSeoMeta', () => {
  it('sets the document title', async () => {
    render(
      <HelmetProvider>
        <Harness />
      </HelmetProvider>
    )
    await waitFor(() => expect(document.title).toBe('Test Title'))
  })

  it('sets a canonical link with the correct href', async () => {
    render(
      <HelmetProvider>
        <Harness />
      </HelmetProvider>
    )
    await waitFor(() => {
      const canonical = document.head.querySelector('link[rel="canonical"]')
      expect(canonical).toBeTruthy()
      expect(canonical!.getAttribute('href')).toContain('/listings')
    })
  })
})
