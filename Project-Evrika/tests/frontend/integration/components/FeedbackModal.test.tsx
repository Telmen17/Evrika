import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FeedbackModal } from '@/components/FeedbackModal'
import * as feedbackLib from '@/lib/feedback'

describe('FeedbackModal', () => {
  it('does not render when closed', () => {
    render(<FeedbackModal open={false} onClose={() => undefined} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('submits trimmed feedback and shows thanks', async () => {
    const submitSpy = vi.spyOn(feedbackLib, 'submitFeedback').mockResolvedValue({
      ok: true,
      emailed: false,
    })
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(<FeedbackModal open onClose={onClose} context="unit-test" />)

    await user.type(
      screen.getByPlaceholderText(/What stood out/),
      '  More splash effects please  ',
    )
    await user.click(screen.getByRole('button', { name: 'Loved it' }))
    await user.click(screen.getByRole('button', { name: 'Send feedback' }))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith({
        message: 'More splash effects please',
        sentiment: 'love',
        context: 'unit-test',
      })
    })

    expect(await screen.findByText('Thank you!')).toBeInTheDocument()
    submitSpy.mockRestore()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<FeedbackModal open onClose={onClose} />)

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
