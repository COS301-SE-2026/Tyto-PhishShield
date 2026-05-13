/*
 * PROJECT: Tyto-PhishShield
 * SERVICE: Mailing Service
 * FILE: 02-shared-types.sql
 * DESCRIPTION: Defines custom PostgreSQL Enumerated (ENUM) types.
 */

DO $$ BEGIN
CREATE TYPE mailing.difficulty AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;