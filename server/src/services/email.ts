import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// ponytail: safeEmail wraps every send — email failure never blocks business logic
export async function safeEmail(fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (err) {
    console.error('[Email] Failed to send:', err)
  }
}

export async function sendJobCreatedEmail(to: string, jobTitle: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: `EscrowFlow: New job "${jobTitle}" created`,
    text: `A new escrow job "${jobTitle}" has been created. Log in to EscrowFlow to view details.`,
  })
}

export async function sendMilestoneApprovedEmail(
  to: string,
  milestoneTitle: string,
  amountKobo: number
): Promise<void> {
  const amountNaira = (amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: `EscrowFlow: Milestone "${milestoneTitle}" approved — payment released`,
    text: `Your milestone "${milestoneTitle}" has been approved. ${amountNaira} will be transferred to your bank account.`,
  })
}

export async function sendDisputeOpenedEmail(to: string, jobTitle: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: `EscrowFlow: Dispute opened on job "${jobTitle}"`,
    text: `A dispute has been opened on the job "${jobTitle}". An admin will review and resolve it shortly.`,
  })
}

export async function sendRefundIssuedEmail(
  to: string,
  milestoneTitle: string,
  amountKobo: number
): Promise<void> {
  const amountNaira = (amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: `EscrowFlow: Refund issued for "${milestoneTitle}"`,
    text: `A refund of ${amountNaira} has been issued for milestone "${milestoneTitle}". It will be returned to your account.`,
  })
}
