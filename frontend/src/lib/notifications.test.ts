import { describe, it, expect } from 'vitest'
import { reminderMessages } from './notifications'

describe('reminderMessages', () => {
  it('produces two escalating reminders in the pet voice', () => {
    const msgs = reminderMessages('Sparky')
    expect(msgs).toHaveLength(2)
    expect(msgs[0].hours).toBeLessThan(msgs[1].hours)
    for (const m of msgs) {
      expect(m.title).toContain('Sparky')
      expect(m.body.length).toBeGreaterThan(0)
    }
  })

  it('uses whatever name the pet currently has', () => {
    const msgs = reminderMessages('Mochi')
    expect(msgs.every((m) => !m.title.includes('Sparky'))).toBe(true)
    expect(msgs[0].title).toContain('Mochi')
  })
})
