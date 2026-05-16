/*
 * PROJECT: Tyto-PhishShield
 * SERVICE: Mailing Service
 * FILE: 03-mailing-tables.sql
 * DESCRIPTION: Defines the core table structures and performance indexes.
 */

CREATE TABLE IF NOT EXISTS mailing.generated_emails (

    -- Primary key for each generated email.
    email_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- This is a unique number that can be used as a reference by the user.
    -- Ex. ref = EMAIL-2026-XJ9.
    reference_number VARCHAR(20) UNIQUE NOT NULL,

    -- The sender address (from).
    sender VARCHAR(255) NOT NULL,

    -- An optional alias used for the recipient's tracking.
    alias VARCHAR(255) DEFAULT NULL,

    -- The recipient of the email.
    recipient VARCHAR(255) NOT NULL

    -- The email subject line.
    subject VARCHAR(255) NOT NULL,

    -- This is the actual body of the email.
    -- Stored as TEXT to accommodate long HTML or plain text content.
    content TEXT NOT NULL,

    -- Difficulty: easy, medium, hard.
    -- Used to categorise the complexity of the phishing simulation.
    difficulty mailing.difficulty NOT NULL DEFAULT 'medium',

    -- Metadata for tracking and auditing.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

-- Indexes for performance on common lookups.
CREATE INDEX IF NOT EXISTS idx_generated_emails_to ON mailing.generated_emails(email_to);
CREATE INDEX IF NOT EXISTS idx_generated_emails_ref ON mailing.generated_emails(reference_number);
CREATE INDEX IF NOT EXISTS idx_generated_emails_difficulty ON mailing.generated_emails(difficulty);