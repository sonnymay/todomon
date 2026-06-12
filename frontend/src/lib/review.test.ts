import { describe, it, expect } from 'vitest'
import { nextReviewState } from './review'

describe('nextReviewState', () => {
  it('asks on the first occurrence of a trigger', () => {
    const { ask, state } = nextReviewState({ asked: [] }, 'evolution')
    expect(ask).toBe(true)
    expect(state.asked).toEqual(['evolution'])
  })

  it('never asks twice for the same trigger', () => {
    const { ask, state } = nextReviewState({ asked: ['evolution'] }, 'evolution')
    expect(ask).toBe(false)
    expect(state.asked).toEqual(['evolution'])
  })

  it('still asks for a different trigger', () => {
    const { ask, state } = nextReviewState({ asked: ['evolution'] }, 'streak_milestone')
    expect(ask).toBe(true)
    expect(state.asked).toEqual(['evolution', 'streak_milestone'])
  })
})
