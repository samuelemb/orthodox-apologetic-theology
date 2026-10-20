-- Tests are transactional and never part of the development content seed.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id,aud,role,email,raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111','authenticated','authenticated','owner@example.test','{}'),
 ('22222222-2222-4222-8222-222222222222','authenticated','authenticated','visitor@example.test','{"is_owner":true,"role":"owner"}');
insert into private.owner_allowlist(user_id) values ('11111111-1111-4111-8111-111111111111');
insert into public.teachings(id,topic_id) values ('security-mixed','repentance'),('security-draft-only','fathers');
insert into public.teaching_translations(teaching_id,language,slug,title,excerpt,article_content,status,published_at) values
 ('security-mixed','en','security-mixed-en','Public English','Public excerpt','{"version":1,"sections":[{"id":"intro","heading":"Intro","paragraphs":["Plain text"]}]}','published',now()),
 ('security-mixed','am','security-mixed-am','Draft Amharic','Private excerpt','{"version":1,"sections":[{"id":"intro","heading":"Intro","paragraphs":["Private text"]}]}','draft',null),
 ('security-draft-only','en','security-draft-only-en','Draft only','Private excerpt','{"version":1,"sections":[{"id":"intro","heading":"Intro","paragraphs":["Private text"]}]}','draft',null);
insert into public.feedback(id,message) values ('33333333-3333-4333-8333-333333333333','Security fixture: private feedback');

-- Each assertion runs as the actual API role with transaction-local JWT claims.
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
select is(current_user::text,'anon','Anonymous role active');
select is((select count(*) from public.topics),4::bigint,'Anonymous reads topics');
select is((select count(*) from public.teaching_translations where teaching_id like 'security-%'),1::bigint,'Anonymous sees only published English, not its draft translation');
select is((select count(*) from public.teachings where id like 'security-%'),1::bigint,'Anonymous cannot read teaching with no published version');
select throws_ok('select * from public.feedback','42501',null,'Anonymous feedback read denied');
select throws_ok($$insert into public.feedback(message) values ('not accepted')$$,'42501',null,'Anonymous direct feedback insertion denied');
select throws_ok($$update public.feedback set status='read'$$,'42501',null,'Anonymous feedback update denied');
select throws_ok('delete from public.feedback','42501',null,'Anonymous feedback deletion denied');
select throws_ok($$insert into public.teachings(id,topic_id) values ('intruder','fathers')$$,'42501',null,'Anonymous teaching insert denied');
select throws_ok($$update public.teaching_translations set title='intruder'$$,'42501',null,'Anonymous translation update denied');
select throws_ok('delete from public.teachings','42501',null,'Anonymous teaching deletion denied');
select throws_ok('select public.is_owner()','42501',null,'Anonymous owner RPC denied');
select throws_ok($$insert into private.owner_allowlist(user_id) values ('22222222-2222-4222-8222-222222222222')$$,'42501',null,'Anonymous self-promotion denied');
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","user_metadata":{"is_owner":true,"role":"owner"}}',true);
select is(current_user::text,'authenticated','Authenticated API role active');
select is(public.is_owner(),false,'Editable metadata does not grant ownership');
select is((select count(*) from public.teaching_translations where teaching_id like 'security-%'),1::bigint,'Non-owner sees only published translations');
select is((select count(*) from public.teachings where id like 'security-%'),1::bigint,'Non-owner cannot read draft-only teaching');
select is((select count(*) from public.feedback),0::bigint,'Non-owner sees no feedback');
select throws_ok($$insert into public.feedback(message) values ('not accepted')$$,'42501',null,'Non-owner direct feedback insertion denied');
select throws_ok($$insert into public.teachings(id,topic_id) values ('intruder','fathers')$$,'42501',null,'Non-owner teaching insertion denied by RLS');
select throws_ok($$insert into public.teaching_translations(teaching_id,language,slug,title,excerpt,article_content) values ('security-mixed','am','intruder','Intruder','Intruder','{"version":1,"sections":[{"id":"intro","heading":"Intro","paragraphs":["Text"]}]}')$$,'42501',null,'Non-owner translation insertion denied');
select is_empty($$update public.teaching_translations set title='intruder' where teaching_id='security-mixed' returning id$$,'Non-owner translation update affects no rows');
select is_empty($$delete from public.teachings where id='security-mixed' returning id$$,'Non-owner teaching delete affects no rows');
select is_empty($$update public.feedback set status='read' returning id$$,'Non-owner feedback update affects no rows');
select is_empty($$delete from public.feedback returning id$$,'Non-owner feedback delete affects no rows');
select throws_ok('select * from private.owner_allowlist','42501',null,'Non-owner cannot enumerate allowlist');
select throws_ok($$insert into private.owner_allowlist(user_id) values ('22222222-2222-4222-8222-222222222222')$$,'42501',null,'Non-owner self-promotion denied');
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select is(public.is_owner(),true,'Owner authorized by protected allowlist');
select is((select count(*) from public.teaching_translations where teaching_id like 'security-%'),3::bigint,'Owner reads published and draft versions');
select is((select count(*) from public.teachings where id like 'security-%'),2::bigint,'Owner sees draft-only teaching');
select is((select count(*) from public.feedback where id='33333333-3333-4333-8333-333333333333'),1::bigint,'Owner sees feedback');
select lives_ok($$insert into public.teachings(id,topic_id) values ('security-owner-created','sacraments')$$,'Owner creates teaching');
select lives_ok($$insert into public.teaching_translations(teaching_id,language,slug,title,excerpt,article_content) values ('security-owner-created','en','security-owner-created','Owner title','Owner excerpt','{"version":1,"sections":[{"id":"intro","heading":"Intro","paragraphs":["Text"]}]}')$$,'Owner creates draft translation');
select lives_ok($$update public.teaching_translations set status='published',published_at=now() where teaching_id='security-mixed' and language='am'$$,'Owner can publish one translation independently');
select lives_ok($$update public.feedback set status='read' where id='33333333-3333-4333-8333-333333333333'$$,'Owner manages feedback');
select is((select status from public.feedback where id='33333333-3333-4333-8333-333333333333'),'read','Feedback status changed');
select lives_ok($$insert into public.feedback(message) values ('Owner-created fixture')$$,'Owner can create feedback');
select lives_ok($$delete from public.teachings where id='security-owner-created'$$,'Owner deletes teaching and translations');
select is((select count(*) from public.teaching_translations where teaching_id='security-owner-created'),0::bigint,'Cascade removes translation');
select throws_ok($$insert into private.owner_allowlist(user_id) values ('22222222-2222-4222-8222-222222222222')$$,'42501',null,'Even owner session cannot promote other users');
select throws_ok($$update public.teachings set id='security-renamed' where id='security-mixed'$$,'23514',null,'Stable teaching ID cannot be renamed');
-- Constraints are exercised as owner, so successes do not rely on bypass privileges.
select throws_ok($$insert into public.teaching_translations(teaching_id,language,slug,title,excerpt,article_content) values ('security-mixed','en','duplicate-en','Duplicate','Excerpt','{"version":1,"sections":[{"id":"intro","heading":"Intro","paragraphs":["Text"]}]}')$$,'23505',null,'One version per teaching/language enforced');
select throws_ok($$update public.teaching_translations set slug='security-mixed-en' where slug='security-mixed-am'$$,'23505',null,'Slugs globally unique');
select throws_ok($$update public.teaching_translations set article_content='{"version":1,"html":"<script>alert(1)</script>","sections":[]}' where slug='security-mixed-en'$$,'23514',null,'Unsafe/unstructured document rejected');
select throws_ok($$update public.teaching_translations set article_content='{"version":1,"sections":[{"id":"same","heading":"A","paragraphs":["A"]},{"id":"same","heading":"B","paragraphs":["B"]}]}' where slug='security-mixed-en'$$,'23514',null,'Duplicate section IDs rejected');
select throws_ok($$update public.teaching_translations set youtube_video_id='https://bad.example' where slug='security-mixed-en'$$,'23514',null,'Only YouTube IDs accepted');
select throws_ok($$update public.teaching_translations set status='draft' where slug='security-mixed-en'$$,'23514',null,'Draft cannot retain publication time');
select throws_ok($$insert into public.feedback(message) values (E' \n\t')$$,'23514',null,'Whitespace-only feedback rejected');
select throws_ok($$insert into public.feedback(message) values (repeat('a',5001))$$,'23514',null,'Feedback message limit enforced');
select throws_ok($$insert into public.feedback(name,message) values (repeat('a',101),'Valid')$$,'23514',null,'Name limit enforced');
select throws_ok($$insert into public.feedback(email,message) values ('invalid-email','Valid')$$,'23514',null,'Provided email validated');
select throws_ok($$insert into public.feedback(message) values (repeat('😀',2501))$$,'23514',null,'UTF-16 message limit matches browser for emoji');
select throws_ok($$insert into public.feedback(message) values (chr(160)||chr(65279))$$,'23514',null,'Unicode trim whitespace rejected');
select throws_ok($$insert into public.feedback(email,message) values ('person'||chr(160)||'@example.test','Valid')$$,'23514',null,'Unicode email whitespace rejected');
select throws_ok($$insert into public.teachings(id,topic_id) values ('security-invalid-topic','missing-topic')$$,'23503',null,'Topic foreign key enforced');
select lives_ok($$insert into public.feedback(message) values ('No name or email needed')$$,'Optional name/email accepted');
select lives_ok($$delete from public.feedback where id='33333333-3333-4333-8333-333333333333'$$,'Owner deletes feedback');
reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
select is((select count(*) from public.teaching_translations where teaching_id='security-mixed'),2::bigint,'After owner publication both versions are public');
select is((select count(*) from public.teachings where id='security-mixed'),1::bigint,'Publishing translation preserves single teaching identity');
reset role;
-- Revocation must immediately invalidate the boolean RPC even with the same JWT.
delete from private.owner_allowlist where user_id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select is(public.is_owner(),false,'Allowlist revocation takes effect without editing JWT metadata');
select is((select count(*) from public.feedback),0::bigint,'Revoked owner loses feedback access');
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
select is(public.is_owner(),false,'Missing user identity fails closed');
reset role;
select * from finish();
rollback;
