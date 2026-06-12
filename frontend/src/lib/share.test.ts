import { describe, it, expect } from 'vitest'
import { APP_STORE_URL, buildShareText } from './share'

describe('buildShareText', () => {
  it('includes the pet name, stage, streak, and App Store link', () => {
    const text = buildShareText('Sunny', 'Champion', 7)
    expect(text).toContain('Sunny')
    expect(text).toContain('Champion')
    expect(text).toContain('7-day streak')
    expect(text).toContain(APP_STORE_URL)
  })

  it('omits the streak line when streak is 0', () => {
    const text = buildShareText('Sunny', 'Egg', 0)
    expect(text).not.toContain('streak')
    expect(text).toContain(APP_STORE_URL)
  })
})
