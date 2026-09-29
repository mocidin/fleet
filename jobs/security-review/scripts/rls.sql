-- Read-only posture dump for one Supabase project. Run through the Supabase MCP execute_sql, one statement per call.
-- Statement 1: every public table, whether RLS is on, and the full policy text with the grants anon/authenticated hold.
select c.relname as "table", c.relrowsecurity as rls,
  coalesce((select json_agg(json_build_object('name', p.policyname, 'cmd', p.cmd, 'roles', p.roles, 'using', p.qual, 'check', p.with_check) order by p.cmd)
            from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname), '[]'::json) as policies,
  (select string_agg(g.grantee || ':' || g.privilege_type, ',' order by g.grantee, g.privilege_type)
     from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.table_name = c.relname and g.grantee in ('anon', 'authenticated')) as grants
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by 1;

-- Statement 2: every public function callable over the API (RPC), whether it runs as definer, and who may call it.
select p.proname as "function", p.prosecdef as definer, pg_get_function_identity_arguments(p.oid) as args,
  (select string_agg(r.grantee || ':' || r.privilege_type, ',')
     from information_schema.routine_privileges r
    where r.specific_schema = 'public' and r.routine_name = p.proname and r.grantee in ('anon', 'authenticated')) as grants
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by 1;
