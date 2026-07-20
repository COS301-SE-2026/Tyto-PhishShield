INSERT INTO questions ("questionText", "options", "correctOptionIndex", "createdAt")
VALUES
  (
    'What is the primary goal of a phishing attack?',
    '{"To deliver software updates","To steal sensitive information or credentials","To advertise a product","To invite you to a meeting"}',
    1,
    NOW()
  ),
  (
    'You receive an email from your bank asking you to verify your account details by clicking a link. What should you do?',
    '{"Click the link and enter your details","Reply to the email with your account number","Open your banking app or contact the bank directly","Forward the email to a friend to ask their opinion"}',
    2,
    NOW()
  ),
  (
    'What is spear phishing?',
    '{"A phishing attack that targets many people at once","A phishing attack that uses text messages","A targeted phishing attack aimed at a specific person or organisation","An attack that uses fake phone calls"}',
    2,
    NOW()
  ),
  (
    'What is a common sign of a phishing email?',
    '{"Perfect grammar and official logos","The email addresses you by your full name","Unexpected attachments or links, urgent language, and unknown senders","The email comes from your manager"}',
    2,
    NOW()
  ),
  (
    'What should you do if you suspect an email is a phishing attempt?',
    '{"Reply to the email to confirm its legitimacy","Click the link to see where it goes","Report it to your IT security team and delete it","Ignore it and move on"}',
    2,
    NOW()
  ),
  (
    'What does "smishing" refer to?',
    '{"Phishing attacks through email","Phishing attacks through SMS text messages","Phishing attacks through social media","Phishing attacks through phone calls"}',
    1,
    NOW()
  ),
  (
    'Which of the following is NOT a red flag in an email?',
    '{"A mismatched sender domain","Urgency to act immediately","An email from your manager’s known address about a scheduled meeting","An unexpected attachment from an unknown sender"}',
    2,
    NOW()
  ),
  (
    'How can multi‑factor authentication (MFA) help protect against phishing?',
    '{"It blocks all emails from unknown senders","It prevents you from clicking malicious links","Even if your password is stolen, the attacker still cannot access your account without the second factor","It automatically detects and deletes phishing emails"}',
    2,
    NOW()
  ),
  (
    'What is the best way to verify a link in an email is safe?',
    '{"Click the link quickly before the email expires","Hover over the link to see the actual URL and check if it matches the expected destination","Copy the link and send it to a colleague for verification","Only click links that have HTTPS in the address"}',
    1,
    NOW()
  ),
  (
    'What should you do if you accidentally clicked a phishing link or opened an attachment?',
    '{"Wait and see if anything happens","Run a free online antivirus scanner","Immediately contact your IT security team and change your passwords","Reply to the email and ask the sender to stop"}',
    2,
    NOW()
  );