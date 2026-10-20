begin;
-- One shared budget across all application instances. No sender/IP data is stored.
create table private.feedback_submission_budget (
 id boolean primary key default true check (id),
 window_started timestamptz not null,
 accepted integer not null check (accepted between 0 and 20)
);
alter table private.feedback_submission_budget enable row level security;
revoke all on private.feedback_submission_budget from public,anon,authenticated,service_role;
insert into private.feedback_submission_budget(id,window_started,accepted) values(true,now(),0);

create function public.submit_public_feedback(p_name text,p_email text,p_message text)
returns text language plpgsql security definer set search_path='' as $$
declare budget private.feedback_submission_budget%rowtype;
begin
 -- EXECUTE is granted only to the trusted server role; never to browser callers.
 if p_name is not null and (p_name <> public.trim_input(p_name) or public.utf16_length(p_name)>100) then raise exception 'Invalid feedback' using errcode='22023'; end if;
 if p_email is not null and (p_email <> public.trim_input(p_email) or not public.valid_feedback_email(p_email)) then raise exception 'Invalid feedback' using errcode='22023'; end if;
 if p_message is null or public.trim_input(p_message)='' or public.utf16_length(p_message)>5000 then raise exception 'Invalid feedback' using errcode='22023'; end if;
 select * into strict budget from private.feedback_submission_budget where id=true for update;
 if budget.window_started <= now()-interval '10 minutes' then
  budget.window_started:=now();budget.accepted:=0;
 end if;
 if budget.accepted>=20 then return 'limited'; end if;
 insert into public.feedback(name,email,message,status) values(nullif(p_name,''),nullif(p_email,''),p_message,'unread');
 update private.feedback_submission_budget set window_started=budget.window_started,accepted=budget.accepted+1 where id=true;
 return 'accepted';
end;
$$;
revoke all on function public.submit_public_feedback(text,text,text) from public,anon,authenticated;
grant execute on function public.submit_public_feedback(text,text,text) to service_role;
-- The application uses only the narrow insert-and-limit function, never table APIs.
revoke insert on public.feedback from service_role;
commit;
