-- #28 practice results per card: times seen, times known and when it was last practised.
--
-- Kept on the card itself: one row per card is all the product needs (no history, no
-- spaced repetition, see "Out of scope" in docs/BACKLOG.md), and the card's policies
-- already decide who may read and write it.

alter table public.cards
  add column times_seen integer not null default 0 check (times_seen >= 0),
  add column times_known integer not null default 0 check (times_known >= 0),
  add column last_practiced_at timestamptz,
  add constraint cards_known_not_more_than_seen check (times_known <= times_seen);

-- Records a batch of ratings, all or nothing. p_ratings is a JSON array of
-- {"cardId": uuid, "knew": boolean}; the same card may appear more than once.
-- Returns the number of ratings recorded, or null (and writes nothing) when any card is
-- missing or in somebody else's deck.
create function public.record_ratings(p_ratings jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total integer;
  v_visible integer;
begin
  with r as (
    select distinct (value ->> 'cardId')::uuid as card_id
    from jsonb_array_elements(coalesce(p_ratings, '[]'::jsonb))
  )
  select (select count(*) from r), (select count(*) from r join public.cards c on c.id = r.card_id)
  into v_total, v_visible;

  -- RLS hides foreign cards, so a foreign card and a missing one look the same here.
  if v_visible < v_total then
    return null;
  end if;

  update public.cards c
  set times_seen = c.times_seen + agg.seen,
      times_known = c.times_known + agg.known,
      last_practiced_at = now()
  from (
    select (value ->> 'cardId')::uuid as card_id,
           count(*)::integer as seen,
           count(*) filter (where (value ->> 'knew')::boolean)::integer as known
    from jsonb_array_elements(coalesce(p_ratings, '[]'::jsonb))
    group by 1
  ) agg
  where c.id = agg.card_id;

  return jsonb_array_length(coalesce(p_ratings, '[]'::jsonb));
end;
$$;

revoke execute on function public.record_ratings(jsonb) from public, anon;
grant execute on function public.record_ratings(jsonb) to authenticated;
