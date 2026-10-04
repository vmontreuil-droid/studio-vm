-- 0053 — Invordering in het buitenland: vaste partner per land
--
-- De tabel deurwaarders (0052) kende enkel de 12 Belgische gerechtelijke
-- arrondissementen. Nu ook een vaste partner (deurwaarder of incassokantoor)
-- voor klanten in Nederland, Duitsland, Frankrijk en Luxemburg:
-- 'land-nl', 'land-de', 'land-fr', 'land-lu'.
--
-- Uitvoeren: Supabase -> SQL Editor -> plak dit volledige bestand -> Run.
-- Veilig om opnieuw te draaien.

alter table public.deurwaarders drop constraint if exists deurwaarders_arrondissement_check;
alter table public.deurwaarders add constraint deurwaarders_arrondissement_check check (arrondissement in (
  'antwerpen', 'limburg', 'oost-vlaanderen', 'west-vlaanderen', 'leuven',
  'brussel', 'waals-brabant', 'henegouwen', 'luik', 'luxemburg', 'namen', 'eupen',
  'land-nl', 'land-de', 'land-fr', 'land-lu'));

-- Startwaarden (opgezocht op hun eigen website, 4/10/2026). Aan te passen in
-- Beheer -> Invordering -> Deurwaarders; opnieuw draaien overschrijft niets.
insert into public.deurwaarders (arrondissement, naam, kantoor, email, telefoon, adres, taal, notitie) values
  ('land-nl', 'Flanderijn gerechtsdeurwaarders & incasso', 'Hoofdkantoor Rotterdam (ook vestiging Antwerpen)',
   'info@flanderijn.nl', '+31 88 209 2444', E'Postbus 25042\n3001 HA Rotterdam\nNederland', 'nl',
   'Bron: flanderijn.nl/contact. Minnelijke en gerechtelijke incasso, zakelijk.'),
  ('land-de', 'Capital Incasso', 'Inkasso für ausländische Gläubiger (Thomas F. Meier)',
   'info@capital-incasso.de', '+49 421 30 22 24', E'Richard-Dehmel-Straße 32\n28211 Bremen\nDeutschland', 'de',
   'Bron: capital-incasso.de. Amtlich zugelassenes Inkassounternehmen voor buitenlandse schuldeisers, ook B2B.'),
  ('land-fr', 'Pegasus commissaires de justice', 'Étude de Lille (aussi Paris)',
   'contact@pegasus-cdj.com', '+33 3 20 16 94 50', E'34, rue de la Grande Chaussée\n59000 Lille\nFrance', 'fr',
   'Bron: pegasus-cdj.com. Recouvrement amiable et judiciaire pour entreprises.'),
  ('land-lu', 'Étude Christine Kovelter, huissier de justice', null,
   'info@huissier-kovelter.lu', '+352 44 24 15', E'6, Montée Pilate\nL-2336 Luxembourg', 'fr',
   'Bron: huissier-kovelter.lu. Recouvrement de créances.')
on conflict (arrondissement) do nothing;

notify pgrst, 'reload schema';
