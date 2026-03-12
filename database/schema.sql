-- Message schema for the legacy monolith.
-- Run database/rooms_schema.sql first so rooms and helper functions already exist.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai_message BOOLEAN NOT NULL DEFAULT FALSE,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  has_ai_response BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS messages_room_created_idx
ON public.messages (room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_user_room_idx
ON public.messages (user_id, room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_privacy_filter
ON public.messages (room_id, is_private, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_private_requester
ON public.messages (requester_id, room_id, created_at DESC)
WHERE is_private = TRUE;

CREATE INDEX IF NOT EXISTS idx_messages_active
ON public.messages (room_id, deleted_at, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_deleted
ON public.messages (deleted_at, deleted_by, room_id)
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_ai_response
ON public.messages (has_ai_response, room_id, created_at DESC)
WHERE has_ai_response = TRUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_deleted_by_equals_user_id'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT check_deleted_by_equals_user_id
      CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by = user_id)
      );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.set_deleted_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    NEW.deleted_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_set_deleted_at ON public.messages;
CREATE TRIGGER auto_set_deleted_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.set_deleted_at_timestamp();

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon users can read public active messages" ON public.messages;
CREATE POLICY "Anon users can read public active messages"
ON public.messages
FOR SELECT
TO anon
USING (
  deleted_at IS NULL
  AND is_private = FALSE
  AND public.can_read_room(NULL, room_id)
);

DROP POLICY IF EXISTS "Authenticated users can read visible active messages" ON public.messages;
CREATE POLICY "Authenticated users can read visible active messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND public.can_read_room(auth.uid(), room_id)
  AND (
    is_private = FALSE
    OR requester_id = auth.uid()
    OR user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authenticated users can read their own deleted messages" ON public.messages;
CREATE POLICY "Authenticated users can read their own deleted messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  deleted_at IS NOT NULL
  AND user_id = auth.uid()
  AND public.can_read_room(auth.uid(), room_id)
);

DROP POLICY IF EXISTS "Non-anonymous users can insert messages" ON public.messages;
CREATE POLICY "Non-anonymous users can insert messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND NOT public.is_anonymous_user()
  AND public.can_write_room(auth.uid(), room_id)
  AND (
    NOT EXISTS (
      SELECT 1
      FROM public.rooms
      WHERE id = room_id
        AND kind = 'personal'
    )
    OR is_private = FALSE
  )
);

DROP POLICY IF EXISTS "Non-anonymous users can soft delete their own messages" ON public.messages;
CREATE POLICY "Non-anonymous users can soft delete their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
  AND has_ai_response = FALSE
  AND NOT public.is_anonymous_user()
  AND public.can_write_room(auth.uid(), room_id)
)
WITH CHECK (
  user_id = auth.uid()
  AND deleted_at IS NOT NULL
  AND deleted_by = auth.uid()
  AND has_ai_response = FALSE
  AND NOT public.is_anonymous_user()
  AND public.can_write_room(auth.uid(), room_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END
$$;
