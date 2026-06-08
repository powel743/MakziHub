import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
// Redis client is created on import of the service; stub it so no real connection.
vi.mock('../../config/redis', () => ({ redis: { setex: vi.fn(), get: vi.fn(), del: vi.fn() } }))

import { sendSms } from '../africasTalking.service'

const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.AT_API_KEY = 'test-at-key'
  process.env.AT_USERNAME = 'makazihub'
  process.env.AT_SENDER_ID = 'MakaziHub'
})

describe('sendSms', () => {
  it('calls Africa\'s Talking with the correct params and returns success', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { SMSMessageData: { Message: 'ok', Recipients: [{ statusCode: 101, messageId: 'MSG123' }] } },
    })

    const res = await sendSms({ to: '+254722000000', message: 'Hello', template: 'test' })

    expect(res).toEqual({ success: true, messageId: 'MSG123' })
    expect(mockedAxios.post).toHaveBeenCalledTimes(1)
    const [url, body] = mockedAxios.post.mock.calls[0]
    expect(url).toContain('/messaging')
    // body is URLSearchParams with username/to/message/from
    expect(body.toString()).toContain('username=makazihub')
    expect(body.toString()).toContain('Hello')
  })

  it('returns { success: false } on AT error without throwing', async () => {
    mockedAxios.post = vi.fn().mockRejectedValue(new Error('network down'))

    const res = await sendSms({ to: '0722000000', message: 'Hi' })

    expect(res.success).toBe(false)
    expect(res.error).toContain('network down')
  })

  it('does not call AT and returns failure when credentials are missing', async () => {
    delete process.env.AT_API_KEY
    mockedAxios.post = vi.fn()

    const res = await sendSms({ to: '0722000000', message: 'Hi' })

    expect(res.success).toBe(false)
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  it('reports failure when a recipient is rejected (statusCode != 101)', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { SMSMessageData: { Message: 'fail', Recipients: [{ statusCode: 403, messageId: 'X' }] } },
    })

    const res = await sendSms({ to: '0722000000', message: 'Hi' })
    expect(res.success).toBe(false)
  })
})
