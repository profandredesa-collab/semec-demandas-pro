-- SEMEC DEMANDAS PRO
-- Rode este SQL no Supabase em SQL Editor > New Query.

create table if not exists demandas (
  id bigint generated always as identity primary key,
  titulo text not null,
  descricao text,
  setor text,
  responsavel text,
  prioridade text default 'importante',
  status text default 'pendente',
  prazo date,
  observacoes text,
  criado_em timestamp with time zone default now()
);

create table if not exists anexos_demanda (
  id bigint generated always as identity primary key,
  demanda_id bigint references demandas(id) on delete cascade,
  nome_arquivo text,
  caminho text,
  url_publica text,
  criado_em timestamp with time zone default now()
);

alter table demandas enable row level security;
alter table anexos_demanda enable row level security;

drop policy if exists "Demandas leitura autenticada" on demandas;
drop policy if exists "Demandas insercao autenticada" on demandas;
drop policy if exists "Demandas atualizacao autenticada" on demandas;
drop policy if exists "Demandas delete autenticada" on demandas;

create policy "Demandas leitura autenticada"
on demandas for select
to authenticated
using (true);

create policy "Demandas insercao autenticada"
on demandas for insert
to authenticated
with check (true);

create policy "Demandas atualizacao autenticada"
on demandas for update
to authenticated
using (true)
with check (true);

create policy "Demandas delete autenticada"
on demandas for delete
to authenticated
using (true);

drop policy if exists "Anexos leitura autenticada" on anexos_demanda;
drop policy if exists "Anexos insercao autenticada" on anexos_demanda;
drop policy if exists "Anexos delete autenticada" on anexos_demanda;

create policy "Anexos leitura autenticada"
on anexos_demanda for select
to authenticated
using (true);

create policy "Anexos insercao autenticada"
on anexos_demanda for insert
to authenticated
with check (true);

create policy "Anexos delete autenticada"
on anexos_demanda for delete
to authenticated
using (true);

-- Bucket público para facilitar abertura dos anexos por link.
insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', true)
on conflict (id) do update set public = true;

drop policy if exists "Upload anexos autenticado" on storage.objects;
drop policy if exists "Leitura anexos publica" on storage.objects;
drop policy if exists "Delete anexos autenticado" on storage.objects;

create policy "Upload anexos autenticado"
on storage.objects for insert
to authenticated
with check (bucket_id = 'anexos');

create policy "Leitura anexos publica"
on storage.objects for select
to public
using (bucket_id = 'anexos');

create policy "Delete anexos autenticado"
on storage.objects for delete
to authenticated
using (bucket_id = 'anexos');
