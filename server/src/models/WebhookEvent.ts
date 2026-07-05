import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processed: boolean;
  receivedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  processed: { type: Boolean, default: false },
  receivedAt: { type: Date, default: Date.now },
});

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
