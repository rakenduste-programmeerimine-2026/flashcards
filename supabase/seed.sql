-- Local development seed (issue #39). Applied by `npm run db:reset` after the migrations.
-- It runs ONLY on the local stack: `supabase db push` never sends this file to the hosted project.
--
-- Demo account for signing in locally:  demo@flashcards.local / demo-password
-- These are made-up local credentials, not a secret: the local stack is not reachable from outside.

-- The user. GoTrue reads these columns on sign-in, so the empty strings matter (NULL breaks it).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'demo@flashcards.local',
  extensions.crypt('demo-password', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '{"sub": "00000000-0000-4000-8000-000000000001", "email": "demo@flashcards.local", "email_verified": true}',
  'email', now(), now(), now()
);

-- One demo deck with twelve cards, so the deck list and practice have something to show.
insert into public.decks (id, owner_id, name, language) values (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  'Andmebaasid: põhimõisted',
  'et'
);

insert into public.cards (deck_id, term, meaning, position)
select '00000000-0000-4000-8000-000000000101', c.term, c.meaning, c.position
from (values
  ('Tabel', 'Andmete kogum ridade ja veergudena; iga rida on üks kirje.', 0),
  ('Primaarvõti', 'Veerg või veergude kogum, mis eristab tabeli iga rea üheselt.', 1),
  ('Võõrvõti', 'Veerg, mis viitab teise tabeli primaarvõtmele ja seob tabelid.', 2),
  ('Indeks', 'Lisastruktuur, mis kiirendab otsingut veeru järgi.', 3),
  ('Tehing', 'Päringute rühm, mis rakendub tervikuna või üldse mitte.', 4),
  ('Normaliseerimine', 'Tabelite jaotamine nii, et sama fakti ei hoita mitmes kohas.', 5),
  ('JOIN', 'Päringu osa, mis ühendab kahe tabeli read seotud veeru järgi.', 6),
  ('Migratsioon', 'Versioonihalduses fail, mis muudab andmebaasi skeemi kindlas järjekorras.', 7),
  ('RLS', 'Row level security: reeglid, mis määravad, milliseid ridu kasutaja näeb ja muudab.', 8),
  ('Vaade', 'Salvestatud päring, mida saab kasutada nagu tabelit.', 9),
  ('Piirang', 'Reegel (näiteks NOT NULL või CHECK), mida iga rida peab täitma.', 10),
  ('Kaskaadkustutamine', 'Seotud ridade automaatne kustutamine, kui viidatud rida kustutatakse.', 11)
) as c(term, meaning, position);
