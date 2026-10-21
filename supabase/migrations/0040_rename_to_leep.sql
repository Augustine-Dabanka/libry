-- Lybry: rename the house brand stored in data ("Libry" -> "Lybry").
-- Only touches the house imprint and official copy, never user-written text
-- (community post bodies, reviews, book content are left exactly as written).
-- Safe to run any time, safe to re-run. Run it right after the Lybry code is
-- live: the app maps both names to the same author bio, so order is not fatal.

begin;

-- House imprint on books and follows
update public.books          set author     = 'Lybry Originals' where author     = 'Libry Originals';
update public.books          set created_by = 'Lybry Originals' where created_by = 'Libry Originals';
update public.author_follows set author     = 'Lybry Originals' where author     = 'Libry Originals'
  and not exists (select 1 from public.author_follows f2
                  where f2.follower_id = author_follows.follower_id and f2.author = 'Lybry Originals');
delete from public.author_follows where author = 'Libry Originals';

-- House account pen name and its posts' display name
update public.profiles        set pen_name    = 'Lybry Originals' where pen_name    = 'Libry Originals';
update public.community_posts set author_name = 'Lybry'           where author_name = 'Libry';
update public.community_posts set author_name = 'Lybry Originals' where author_name = 'Libry Originals';

-- Official copy we wrote ourselves
update public.communities    set description = replace(description, 'Libry', 'Lybry') where description like '%Libry%';
update public.sale_campaigns set description = replace(description, 'Libry', 'Lybry') where description like '%Libry%';

commit;
