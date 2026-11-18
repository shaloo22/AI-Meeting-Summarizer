import { Schema, model } from 'mongoose'

const actionItemSchema = new Schema(
  {
    owner: { type: String, required: true },
    task: { type: String, required: true },
  },
  { _id: false },
)

const meetingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    transcript: { type: String, required: true },
    summary: { type: String, default: '' },
    actionItems: { type: [actionItemSchema], default: [] },
  },
  { timestamps: true },
)

export const Meeting = model('Meeting', meetingSchema)