-- One review per guardian per completed kids session or workshop enrollment.
CREATE UNIQUE INDEX IF NOT EXISTS "kids_reviews_guardian_booking_uniq" ON "kids_reviews" ("guardian_user_id", "booking_id") WHERE "booking_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kids_reviews_guardian_enrollment_uniq" ON "kids_reviews" ("guardian_user_id", "enrollment_id") WHERE "enrollment_id" IS NOT NULL;
