-- Bootstrap the first Krunch super admin.
-- Safe to run multiple times.

begin;

insert into public.user_roles (user_id, role, assigned_by)
select id, 'super_admin', id
from auth.users
where lower(email) = 'jeniusokg@gmail.com'
on conflict (user_id, role) do nothing;

commit;
