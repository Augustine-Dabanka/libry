-- Add 12+ to the allowed age ratings (Everyone · 9+ · 12+ · 16+ · 18+),
-- keeping every legacy value so existing books stay valid.
alter table public.books drop constraint if exists books_age_rating_check;
alter table public.books add constraint books_age_rating_check
  check (age_rating is null or age_rating in
    ('Everyone','9+','12+','16+','18+',
     '13+','Everyday','Teen','Mature','All Ages','Everyone | Kids','Everyone (Kids)'));
