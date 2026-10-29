import { Router } from 'express';
import { Schema, model } from 'mongoose';
import { z } from 'zod';

const Subscriber = model('NewsletterSubscriber', new Schema({
  email: { type: String, required: true, unique: true },
  source: { type: String, default: 'herbs-footer' },
}, { timestamps: true }));
export const newsletterRoutes = Router();
newsletterRoutes.post('/', async (req, res, next) => {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email().max(254) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: 'Please enter a valid email address.' }); return; }
  try {
    await Subscriber.updateOne({ email: parsed.data.email }, { $setOnInsert: { email: parsed.data.email, source: 'herbs-footer' } }, { upsert: true });
    res.json({ success: true, message: 'Thank you for subscribing!' });
  } catch (error) {
    if ((error as {code?: number}).code === 11000) { res.json({ success: true, message: 'Thank you for subscribing!' }); return; }
    next(error);
  }
});
