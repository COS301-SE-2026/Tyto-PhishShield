WITH
  departments(code, department) AS (
  VALUES
    (1, 'IT & Security'),
    (2, 'Finance'),
    (3, 'Human Resources'),
    (4, 'Legal & Compliance'),
    (5, 'Operations'),
    (6, 'Executive')
),
  roles(code, role) AS (
  VALUES
    (1, 'user'),
    (2, 'analyst'),
    (3, 'admin')
),
  seed_users(id, "auth0Id", email, name, dept_code, role_code) AS (
    VALUES
    ('a1000000-0000-4000-8000-000000000001', 'auth0|seed00000000000000000001', 'thabo.nkosi@phishshield-demo.local', 'Thabo Nkosi', 1, 1),
    ('a1000000-0000-4000-8000-000000000002', 'auth0|seed00000000000000000002', 'aisha.patel@phishshield-demo.local', 'Aisha Patel', 1, 2),
    ('a1000000-0000-4000-8000-000000000003', 'auth0|seed00000000000000000003', 'johan.vandermerwe@phishshield-demo.local', 'Johan van der Merwe', 1, 1),
    ('a1000000-0000-4000-8000-000000000004', 'auth0|seed00000000000000000004', 'naledi.dlamini@phishshield-demo.local', 'Naledi Dlamini', 1, 1),
    ('a1000000-0000-4000-8000-000000000005', 'auth0|seed00000000000000000005', 'sipho.khumalo@phishshield-demo.local', 'Sipho Khumalo', 2, 1),
    ('a1000000-0000-4000-8000-000000000006', 'auth0|seed00000000000000000006', 'priya.naidoo@phishshield-demo.local', 'Priya Naidoo', 2, 1),
    ('a1000000-0000-4000-8000-000000000007', 'auth0|seed00000000000000000007', 'werner.botha@phishshield-demo.local', 'Werner Botha', 2, 2),
    ('a1000000-0000-4000-8000-000000000008', 'auth0|seed00000000000000000008', 'lerato.mokoena@phishshield-demo.local', 'Lerato Mokoena', 3, 1),
    ('a1000000-0000-4000-8000-000000000009', 'auth0|seed00000000000000000009', 'fatima.ismail@phishshield-demo.local', 'Fatima Ismail', 3, 1),
    ('a1000000-0000-4000-8000-000000000010', 'auth0|seed00000000000000000010', 'kagiso.molefe@phishshield-demo.local', 'Kagiso Molefe', 3, 3),
    ('a1000000-0000-4000-8000-000000000011', 'auth0|seed00000000000000000011', 'chloe.duplessis@phishshield-demo.local', 'Chloe du Plessis', 4, 1),
    ('a1000000-0000-4000-8000-000000000012', 'auth0|seed00000000000000000012', 'bongani.zulu@phishshield-demo.local', 'Bongani Zulu', 4, 1),
    ('a1000000-0000-4000-8000-000000000013', 'auth0|seed00000000000000000013', 'anita.reddy@phishshield-demo.local', 'Anita Reddy', 4, 2),
    ('a1000000-0000-4000-8000-000000000014', 'auth0|seed00000000000000000014', 'pieter.joubert@phishshield-demo.local', 'Pieter Joubert', 5, 1),
    ('a1000000-0000-4000-8000-000000000015', 'auth0|seed00000000000000000015', 'zanele.mahlangu@phishshield-demo.local', 'Zanele Mahlangu', 5, 1),
    ('a1000000-0000-4000-8000-000000000016', 'auth0|seed00000000000000000016', 'ryan.oconnell@phishshield-demo.local', 'Ryan O''Connell', 5, 1),
    ('a1000000-0000-4000-8000-000000000017', 'auth0|seed00000000000000000017', 'nomvula.sithole@phishshield-demo.local', 'Nomvula Sithole', 5, 1),
    ('a1000000-0000-4000-8000-000000000018', 'auth0|seed00000000000000000018', 'david.steenkamp@phishshield-demo.local', 'David Steenkamp', 6, 1),
    ('a1000000-0000-4000-8000-000000000019', 'auth0|seed00000000000000000019', 'grace.mabaso@phishshield-demo.local', 'Grace Mabaso', 6, 2),
    ('a1000000-0000-4000-8000-000000000020', 'auth0|seed00000000000000000020', 'michael.chen@phishshield-demo.local', 'Michael Chen', 6, 1)
  )
INSERT INTO users ("id", "auth0Id", "email", "name", "department", "role", "isVerified", "isActive")
SELECT su.id::uuid, su."auth0Id", su.email, su.name, d.department, r.role::users_role_enum, true, true
FROM seed_users su
JOIN departments d ON d.code = su.dept_code
JOIN roles r ON r.code = su.role_code
ON CONFLICT ("id")
DO NOTHING;