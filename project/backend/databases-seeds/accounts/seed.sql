INSERT INTO users ("id", "auth0Id", "email", "name", "department", "role", "isVerified", "isActive")
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'auth0|seed00000000000000000001', 'thabo.nkosi@phishshield-demo.local', 'Thabo Nkosi', 'IT & Security', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000002', 'auth0|seed00000000000000000002', 'aisha.patel@phishshield-demo.local', 'Aisha Patel', 'IT & Security', 'analyst', true, true),
  ('a1000000-0000-4000-8000-000000000003', 'auth0|seed00000000000000000003', 'johan.vandermerwe@phishshield-demo.local', 'Johan van der Merwe', 'IT & Security', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000004', 'auth0|seed00000000000000000004', 'naledi.dlamini@phishshield-demo.local', 'Naledi Dlamini', 'IT & Security', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000005', 'auth0|seed00000000000000000005', 'sipho.khumalo@phishshield-demo.local', 'Sipho Khumalo', 'Finance', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000006', 'auth0|seed00000000000000000006', 'priya.naidoo@phishshield-demo.local', 'Priya Naidoo', 'Finance', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000007', 'auth0|seed00000000000000000007', 'werner.botha@phishshield-demo.local', 'Werner Botha', 'Finance', 'analyst', true, true),
  ('a1000000-0000-4000-8000-000000000008', 'auth0|seed00000000000000000008', 'lerato.mokoena@phishshield-demo.local', 'Lerato Mokoena', 'Human Resources', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000009', 'auth0|seed00000000000000000009', 'fatima.ismail@phishshield-demo.local', 'Fatima Ismail', 'Human Resources', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000010', 'auth0|seed00000000000000000010', 'kagiso.molefe@phishshield-demo.local', 'Kagiso Molefe', 'Human Resources', 'admin', true, true),
  ('a1000000-0000-4000-8000-000000000011', 'auth0|seed00000000000000000011', 'chloe.duplessis@phishshield-demo.local', 'Chloe du Plessis', 'Legal & Compliance', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000012', 'auth0|seed00000000000000000012', 'bongani.zulu@phishshield-demo.local', 'Bongani Zulu', 'Legal & Compliance', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000013', 'auth0|seed00000000000000000013', 'anita.reddy@phishshield-demo.local', 'Anita Reddy', 'Legal & Compliance', 'analyst', true, true),
  ('a1000000-0000-4000-8000-000000000014', 'auth0|seed00000000000000000014', 'pieter.joubert@phishshield-demo.local', 'Pieter Joubert', 'Operations', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000015', 'auth0|seed00000000000000000015', 'zanele.mahlangu@phishshield-demo.local', 'Zanele Mahlangu', 'Operations', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000016', 'auth0|seed00000000000000000016', 'ryan.oconnell@phishshield-demo.local', 'Ryan O''Connell', 'Operations', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000017', 'auth0|seed00000000000000000017', 'nomvula.sithole@phishshield-demo.local', 'Nomvula Sithole', 'Operations', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000018', 'auth0|seed00000000000000000018', 'david.steenkamp@phishshield-demo.local', 'David Steenkamp', 'Executive', 'user', true, true),
  ('a1000000-0000-4000-8000-000000000019', 'auth0|seed00000000000000000019', 'grace.mabaso@phishshield-demo.local', 'Grace Mabaso', 'Executive', 'analyst', true, true),
  ('a1000000-0000-4000-8000-000000000020', 'auth0|seed00000000000000000020', 'michael.chen@phishshield-demo.local', 'Michael Chen', 'Executive', 'user', true, true)
ON CONFLICT ("id")
DO NOTHING;