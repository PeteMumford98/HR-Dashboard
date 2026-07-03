-- Seed data for first run. Replace the guidelines with Cartwright's real
-- HR best practice documents; the review pass only checks what's in here.

insert into guidelines (title, category, content) values
('One to one write-ups', 'one_to_one',
'Every one to one write-up must include: a short summary, key discussion points, agreed actions with owners, any development areas raised, and a follow-up date. Actions must be specific and dated. Avoid vague commitments like "will improve communication".'),
('Fair and lawful language', 'all',
'Write-ups must be factual and balanced. Describe behaviour and outcomes, not personality. Never reference protected characteristics (age, disability, gender reassignment, marriage, pregnancy, race, religion, sex, sexual orientation). Avoid language that could read as pre-judging a formal process.'),
('Review meetings', 'review',
'Performance review write-ups must record: objectives reviewed, evidence discussed, an agreed rating or outcome if applicable, development objectives for the next period, and support the company will provide. Both parties'' views should be reflected.');

insert into employees (full_name, email, job_title, manager_name, start_date) values
('Demo Employee', 'demo@example.com', 'Account Executive', 'Sam Manager', '2024-03-01');
