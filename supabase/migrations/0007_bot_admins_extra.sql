-- 0007_bot_admins_extra.sql
-- Adiciona o e-mail corporativo do dono na allow-list de admins de prompts.

insert into public.bot_admins (email)
values ('thiago.miziara@arosapp.ai')
on conflict (email) do nothing;
