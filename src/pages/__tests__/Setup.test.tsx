import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Setup from '../Setup'

describe('Setup page', () => {
  it('explains how to configure the first user via env', () => {
    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>,
    )
    expect(screen.getByText(/BOOTSTRAP_ADMIN_USERNAME/)).toBeInTheDocument()
    expect(screen.getByText(/BOOTSTRAP_ADMIN_PASSWORD/)).toBeInTheDocument()
  })
})
