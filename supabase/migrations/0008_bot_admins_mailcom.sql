-- 0008_bot_admins_mailcom.sql
-- Adiciona variação de e-mail (@mail.com) à allow-list.

insert into public.bot_admins (email)
values ('thiagonmiziara@mail.com')
on conflict (email) do nothing;
