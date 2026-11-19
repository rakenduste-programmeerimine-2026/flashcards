-- #7 decks and cards, with row level security.
--
-- Shapes follow the repository interface in lib/repositories/types.ts:
--   decks: one row per deck, owned by the signed-in user
--   cards: the deck's cards, ordered by a gapless position 0..n-1
--
-- Every write that has to touch more than one row (a deck with its cards, moving a card,
-- closing a gap) is a function, so it runs in one transaction. The functions are
-- SECURITY INVOKER: they run as the caller, so the policies below still apply inside them.

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  language text not null check (language in ('et', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index decks_owner_created_idx on public.decks (owner_id, created_at desc);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  term text not null check (char_length(btrim(term)) between 1 and 200),
  meaning text not null check (char_length(btrim(meaning)) between 1 and 1000),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  -- Deferred, so a function can shift positions and only has to be consistent at commit.
  constraint cards_deck_position_key unique (deck_id, position) deferrable initially deferred
);

comment on column public.cards.position is 'Gapless order inside the deck, 0..n-1';

-- Keep decks.updated_at honest on every update.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger decks_touch_updated_at
before update on public.decks
for each row execute function public.touch_updated_at();

-- Row level security: a user sees and changes only their own decks, and a card belongs to
-- whoever owns its deck. Anonymous users get nothing.

alter table public.decks enable row level security;
alter table public.cards enable row level security;

create policy "decks: owner reads" on public.decks
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "decks: owner inserts" on public.decks
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "decks: owner updates" on public.decks
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "decks: owner deletes" on public.decks
  for delete to authenticated using (owner_id = (select auth.uid()));

create function public.owns_deck(target_deck uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.decks d
    where d.id = target_deck and d.owner_id = (select auth.uid())
  );
$$;

create policy "cards: deck owner reads" on public.cards
  for select to authenticated using (public.owns_deck(deck_id));
create policy "cards: deck owner inserts" on public.cards
  for insert to authenticated with check (public.owns_deck(deck_id));
create policy "cards: deck owner updates" on public.cards
  for update to authenticated
  using (public.owns_deck(deck_id))
  with check (public.owns_deck(deck_id));
create policy "cards: deck owner deletes" on public.cards
  for delete to authenticated using (public.owns_deck(deck_id));

create index cards_deck_position_idx on public.cards (deck_id, position);

revoke all on public.decks, public.cards from anon;
grant select, insert, update, delete on public.decks, public.cards to authenticated;

-- ---------------------------------------------------------------------------------------
-- Functions for the writes that touch several rows. Errors the API maps to 409 are raised
-- with their code as the message: 'deck_limit_reached' and 'card_limit_reached'.
-- ---------------------------------------------------------------------------------------

-- A deck and all of its cards, or nothing. Cards keep the order they were given in.
create function public.create_deck_with_cards(
  p_name text,
  p_language text,
  p_cards jsonb,
  p_max_decks integer default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_deck uuid;
begin
  if v_owner is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- One writer per user at a time, so two requests cannot both slip under the limit.
  perform pg_advisory_xact_lock(hashtextextended(v_owner::text, 7));

  if p_max_decks is not null
     and (select count(*) from public.decks where owner_id = v_owner) >= p_max_decks then
    raise exception 'deck_limit_reached' using errcode = 'P0001';
  end if;

  insert into public.decks (owner_id, name, language)
  values (v_owner, p_name, p_language)
  returning id into v_deck;

  insert into public.cards (deck_id, term, meaning, position)
  select v_deck, c.value ->> 'term', c.value ->> 'meaning', (c.ord - 1)::integer
  from jsonb_array_elements(coalesce(p_cards, '[]'::jsonb)) with ordinality as c(value, ord);

  return v_deck;
end;
$$;

-- Adds a card at a position (null or past the end = last) and shifts the ones after it.
-- Returns no row when the deck is missing or somebody else's.
create function public.add_card(
  p_deck_id uuid,
  p_term text,
  p_meaning text,
  p_position integer default null,
  p_max_cards integer default null
)
returns setof public.cards
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
  v_position integer;
begin
  -- Locks the deck row; RLS makes a foreign deck look missing.
  perform 1 from public.decks where id = p_deck_id for update;
  if not found then
    return;
  end if;

  select count(*) into v_count from public.cards where deck_id = p_deck_id;
  if p_max_cards is not null and v_count >= p_max_cards then
    raise exception 'card_limit_reached' using errcode = 'P0001';
  end if;

  v_position := least(greatest(coalesce(p_position, v_count), 0), v_count);

  update public.cards set position = position + 1
  where deck_id = p_deck_id and position >= v_position;

  update public.decks set updated_at = now() where id = p_deck_id;

  return query
    insert into public.cards (deck_id, term, meaning, position)
    values (p_deck_id, p_term, p_meaning, v_position)
    returning *;
end;
$$;

-- Changes term, meaning and/or position (null = unchanged). Moving a card renumbers the
-- others so the positions stay 0..n-1. No row when the card is missing or not the caller's.
create function public.update_card(
  p_card_id uuid,
  p_term text default null,
  p_meaning text default null,
  p_position integer default null
)
returns setof public.cards
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_card public.cards;
  v_count integer;
  v_target integer;
begin
  select * into v_card from public.cards where id = p_card_id;
  if not found then
    return;
  end if;
  perform 1 from public.decks where id = v_card.deck_id for update;

  if p_position is not null then
    select count(*) into v_count from public.cards where deck_id = v_card.deck_id;
    v_target := least(greatest(p_position, 0), v_count - 1);

    if v_target > v_card.position then
      update public.cards set position = position - 1
      where deck_id = v_card.deck_id and position > v_card.position and position <= v_target;
    elsif v_target < v_card.position then
      update public.cards set position = position + 1
      where deck_id = v_card.deck_id and position >= v_target and position < v_card.position;
    end if;
  else
    v_target := v_card.position;
  end if;

  update public.decks set updated_at = now() where id = v_card.deck_id;

  return query
    update public.cards
    set term = coalesce(p_term, term),
        meaning = coalesce(p_meaning, meaning),
        position = v_target
    where id = p_card_id
    returning *;
end;
$$;

-- Deletes a card and closes the gap. False when the card is missing or not the caller's.
create function public.delete_card(p_card_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_card public.cards;
begin
  delete from public.cards where id = p_card_id returning * into v_card;
  if not found then
    return false;
  end if;

  update public.cards set position = position - 1
  where deck_id = v_card.deck_id and position > v_card.position;

  update public.decks set updated_at = now() where id = v_card.deck_id;
  return true;
end;
$$;

revoke execute on function
  public.create_deck_with_cards(text, text, jsonb, integer),
  public.add_card(uuid, text, text, integer, integer),
  public.update_card(uuid, text, text, integer),
  public.delete_card(uuid)
from public, anon;

grant execute on function
  public.create_deck_with_cards(text, text, jsonb, integer),
  public.add_card(uuid, text, text, integer, integer),
  public.update_card(uuid, text, text, integer),
  public.delete_card(uuid),
  public.owns_deck(uuid)
to authenticated;
