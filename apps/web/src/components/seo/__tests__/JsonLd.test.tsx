import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { ListingJsonLd } from '../ListingJsonLd'
import { EstateJsonLd } from '../EstateJsonLd'

async function getJsonLd() {
  return waitFor(() => {
    const script = document.head.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()
    return JSON.parse(script!.textContent!)
  })
}

describe('ListingJsonLd', () => {
  it('renders a RealEstateListing script with offer + address', async () => {
    render(
      <HelmetProvider>
        <ListingJsonLd
          listing={{
            id: 'abc',
            title: '2 Bedroom in Kasarani',
            description: 'Nice place',
            estate: 'Kasarani',
            rent_ksh: 25000,
            photos: [{ url: 'http://img/1.jpg' }],
          }}
        />
      </HelmetProvider>
    )

    const data = await getJsonLd()
    expect(data['@type']).toBe('RealEstateListing')
    expect(data.name).toBe('2 Bedroom in Kasarani')
    expect(data.offers.price).toBe(25000)
    expect(data.offers.priceCurrency).toBe('KES')
    expect(data.address.addressLocality).toBe('Kasarani')
    expect(data.image).toBe('http://img/1.jpg')
  })
})

describe('EstateJsonLd', () => {
  it('renders a Place script for the estate', async () => {
    render(
      <HelmetProvider>
        <EstateJsonLd estate={{ name: 'Westlands', slug: 'westlands', description: 'Leafy suburb' }} listingIds={['l1', 'l2']} />
      </HelmetProvider>
    )

    const data = await getJsonLd()
    expect(data['@type']).toBe('Place')
    expect(data.name).toContain('Westlands')
    expect(Array.isArray(data.containsPlace)).toBe(true)
    expect(data.containsPlace).toHaveLength(2)
  })
})
