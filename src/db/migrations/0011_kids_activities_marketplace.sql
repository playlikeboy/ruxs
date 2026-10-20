INSERT INTO "categories" ("id", "label", "short_label", "emoji", "blurb", "tint", "cover_from", "cover_to", "sort", "fulfilment") VALUES
('kids', 'Kids Activities & Classes', 'Kids', '🚀', 'Robotics, chess, art, karate & coding for kids', '#FEF08A', '#FEF08A', '#BAE6FD', 4, 'booking'),
('kids-kits', 'Kids Learning & DIY Kits', 'Kids Kits', '🧩', 'Montessori toys & STEM experiment boxes', '#BAE6FD', '#BAE6FD', '#FEF08A', 8, 'delivery')
ON CONFLICT ("id") DO UPDATE SET
  "label" = EXCLUDED."label",
  "short_label" = EXCLUDED."short_label",
  "emoji" = EXCLUDED."emoji",
  "blurb" = EXCLUDED."blurb",
  "tint" = EXCLUDED."tint",
  "cover_from" = EXCLUDED."cover_from",
  "cover_to" = EXCLUDED."cover_to",
  "sort" = EXCLUDED."sort",
  "fulfilment" = EXCLUDED."fulfilment";
