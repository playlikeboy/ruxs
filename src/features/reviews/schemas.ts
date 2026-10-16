import { z } from "zod";

export const saveReviewSchema = z.object({
  vendorSlug: z.string().min(1),
  rating: z.number().int().min(1, "Pick 1 to 5 stars").max(5),
  comment: z.string().trim().max(500).optional(),
});

export const replySchema = z.object({
  slug: z.string().min(1),
  reviewId: z.string().min(1),
  reply: z.string().trim().max(500),
});

export const hideSchema = z.object({
  reviewId: z.string().min(1),
  hidden: z.boolean(),
});
