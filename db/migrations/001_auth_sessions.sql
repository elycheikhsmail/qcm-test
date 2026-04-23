-- Migration 001 : table auth_sessions pour Sprint 7 (auth email+password)
-- Sessions serveur avec cookie httpOnly session_id (UUID)

CREATE TABLE IF NOT EXISTS auth_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
