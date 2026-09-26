import type { ResendReceivedWebhookPayloadDto as ReceivedPayload } from '@phishshield/dto';

export function toReceivedReply(payload: ReceivedPayload, eventId: string) {
  const { data } = payload;
  return {
    webhookEventId: eventId,
    receivedAt: payload.created_at,
    emailId: data.email_id,
    messageId: data.message_id,
    from: data.from,
    to: data.to,
    cc: data.cc ?? [],
    bcc: data.bcc ?? [],
    subject: data.subject,
    attachments: (data.attachments ?? []).map((a) => ({
      id: a.id,
      filename: a.filename,
      contentType: a.content_type,
    })),
  };
}
