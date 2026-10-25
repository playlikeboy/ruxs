-- provider_profiles was replaced in 0013 by one profile table per vendor type
-- (fitness_trainers, physio_clinics, mehndi_artists, kids_*_profiles). Nothing reads it.
DROP TABLE IF EXISTS "provider_profiles" CASCADE;
