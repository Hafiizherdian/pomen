insert into profiles (id, email, full_name) values
  ('00000000-0000-0000-0000-000000000001', 'admin@cgkn.local', 'Admin CGKN'),
  ('00000000-0000-0000-0000-000000000002', 'digimar@cgkn.local', 'Tim DIGIMAR')
on conflict (id) do nothing;

insert into projects (id, name, description, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Post', 'Konten feed', 'post'),
  ('22222222-2222-2222-2222-222222222222', 'Reels', 'Konten video pendek', 'reels'),
  ('33333333-3333-3333-3333-333333333333', 'Kalender', 'Kalender konten', 'kalender')
on conflict (id) do nothing;

insert into columns (project_id, name, position)
select p.id, n.name, n.pos
from projects p
cross join (values ('To Do', 0), ('In Progress', 1), ('Done', 2)) as n(name, pos)
where not exists (select 1 from columns c where c.project_id = p.id);

insert into tasks (column_id, title, description, priority, position, assigned_to)
select c.id, 'Task contoh', 'Edit atau hapus task ini', 'medium', 0,
       '00000000-0000-0000-0000-000000000001'
from columns c
join projects p on p.id = c.project_id
where p.slug = 'post' and c.position = 0
  and not exists (select 1 from tasks);