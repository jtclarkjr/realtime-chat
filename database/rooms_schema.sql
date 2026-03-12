-- Legacy conversation schema for groups, channels, and personal chats.
-- Run this file before database/schema.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.is_anonymous_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_anonymous FROM auth.users WHERE id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_anonymous_user() TO anon;
GRANT EXECUTE ON FUNCTION public.is_anonymous_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_anonymous_user() TO service_role;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_memberships (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  can_read BOOLEAN NOT NULL DEFAULT TRUE,
  can_write BOOLEAN NOT NULL DEFAULT TRUE,
  can_admin BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'group'
    CHECK (kind IN ('group', 'personal')),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rooms_kind_consistency CHECK (
    (
      kind = 'group'
      AND group_id IS NOT NULL
      AND owner_user_id IS NULL
    ) OR (
      kind = 'personal'
      AND group_id IS NULL
      AND owner_user_id IS NOT NULL
      AND visibility = 'private'
    )
  )
);

CREATE TABLE IF NOT EXISTS public.room_memberships (
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_ai_personalization_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_style_tone TEXT NOT NULL DEFAULT 'default'
    CHECK (base_style_tone IN (
      'default',
      'professional',
      'friendly',
      'candid',
      'quirky',
      'efficient',
      'nerdy',
      'cynical'
    )),
  response_detail_mode TEXT NOT NULL DEFAULT 'default'
    CHECK (response_detail_mode IN (
      'default',
      'short',
      'detailed',
      'structured'
    )),
  warm TEXT NOT NULL DEFAULT 'default'
    CHECK (warm IN ('default', 'subtle', 'strong')),
  enthusiastic TEXT NOT NULL DEFAULT 'default'
    CHECK (enthusiastic IN ('default', 'subtle', 'strong')),
  headers_and_lists TEXT NOT NULL DEFAULT 'default'
    CHECK (headers_and_lists IN ('default', 'subtle', 'strong')),
  emoji TEXT NOT NULL DEFAULT 'default'
    CHECK (emoji IN ('default', 'subtle', 'strong')),
  custom_instructions TEXT NOT NULL DEFAULT ''
    CHECK (char_length(custom_instructions) <= 1000),
  about_you TEXT NOT NULL DEFAULT ''
    CHECK (char_length(about_you) <= 1000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_ai_usage_buckets (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_kind TEXT NOT NULL
    CHECK (window_kind IN ('five_hour', 'monthly')),
  window_start TIMESTAMPTZ NOT NULL,
  tokens_used BIGINT NOT NULL DEFAULT 0
    CHECK (tokens_used >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, window_kind, window_start)
);

CREATE TABLE IF NOT EXISTS public.user_ai_file_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  accepted_files JSONB NOT NULL DEFAULT '[]'::JSONB,
  warnings JSONB NOT NULL DEFAULT '[]'::JSONB
);

CREATE TABLE IF NOT EXISTS public.user_ai_file_processing_buckets (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0
    CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, window_start)
);

CREATE UNIQUE INDEX IF NOT EXISTS groups_name_unique_idx
ON public.groups ((LOWER(name)));

CREATE UNIQUE INDEX IF NOT EXISTS rooms_group_channel_name_unique_idx
ON public.rooms (group_id, LOWER(name))
WHERE kind = 'group';

CREATE INDEX IF NOT EXISTS idx_groups_visibility
ON public.groups (visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_memberships_user
ON public.group_memberships (user_id, group_id);

CREATE INDEX IF NOT EXISTS idx_rooms_group_lookup
ON public.rooms (group_id, visibility, last_activity_at DESC)
WHERE kind = 'group';

CREATE INDEX IF NOT EXISTS idx_rooms_personal_lookup
ON public.rooms (owner_user_id, last_activity_at DESC)
WHERE kind = 'personal';

CREATE INDEX IF NOT EXISTS idx_rooms_created_by
ON public.rooms (created_by);

CREATE INDEX IF NOT EXISTS idx_room_memberships_user
ON public.room_memberships (user_id, room_id);

CREATE INDEX IF NOT EXISTS idx_user_ai_usage_buckets_lookup
ON public.user_ai_usage_buckets (user_id, window_kind, window_start DESC);

CREATE INDEX IF NOT EXISTS idx_user_ai_file_contexts_lookup
ON public.user_ai_file_contexts (room_id, user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_ai_file_processing_buckets_lookup
ON public.user_ai_file_processing_buckets (user_id, window_start DESC);

DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_ai_personalization_updated_at
ON public.user_ai_personalization_settings;
CREATE TRIGGER update_user_ai_personalization_updated_at
BEFORE UPDATE ON public.user_ai_personalization_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_user_display_name(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = auth, pg_catalog
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      raw_user_meta_data->>'display_name',
      raw_user_meta_data->>'full_name',
      email,
      'Anonymous User'
    )
    FROM auth.users
    WHERE id = user_uuid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_display_name(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_display_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_display_name(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.increment_ai_usage_bucket(
  usage_user_id UUID,
  usage_window_kind TEXT,
  usage_window_start TIMESTAMPTZ,
  token_delta BIGINT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  next_total BIGINT;
BEGIN
  IF token_delta < 0 THEN
    RAISE EXCEPTION 'token_delta must be non-negative';
  END IF;

  INSERT INTO public.user_ai_usage_buckets (
    user_id,
    window_kind,
    window_start,
    tokens_used
  )
  VALUES (
    usage_user_id,
    usage_window_kind,
    usage_window_start,
    token_delta
  )
  ON CONFLICT (user_id, window_kind, window_start)
  DO UPDATE
    SET tokens_used = public.user_ai_usage_buckets.tokens_used + EXCLUDED.tokens_used,
        updated_at = NOW()
  RETURNING tokens_used INTO next_total;

  RETURN next_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ai_usage_bucket(UUID, TEXT, TIMESTAMPTZ, BIGINT) TO service_role;

CREATE OR REPLACE FUNCTION public.increment_ai_file_processing_bucket(
  processing_user_id UUID,
  processing_window_start TIMESTAMPTZ,
  request_delta INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  next_total INTEGER;
BEGIN
  IF request_delta < 0 THEN
    RAISE EXCEPTION 'request_delta must be non-negative';
  END IF;

  INSERT INTO public.user_ai_file_processing_buckets (
    user_id,
    window_start,
    request_count
  )
  VALUES (
    processing_user_id,
    processing_window_start,
    request_delta
  )
  ON CONFLICT (user_id, window_start)
  DO UPDATE
    SET request_count = public.user_ai_file_processing_buckets.request_count + EXCLUDED.request_count,
        updated_at = NOW()
  RETURNING request_count INTO next_total;

  RETURN next_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ai_file_processing_bucket(UUID, TIMESTAMPTZ, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.can_read_room(
  viewer_uuid UUID,
  room_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  room_record public.rooms%ROWTYPE;
  group_record public.groups%ROWTYPE;
  membership_record public.group_memberships%ROWTYPE;
  has_room_membership BOOLEAN := FALSE;
  can_bypass_private BOOLEAN := FALSE;
BEGIN
  SELECT * INTO room_record
  FROM public.rooms
  WHERE id = room_uuid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF room_record.kind = 'personal' THEN
    RETURN viewer_uuid IS NOT NULL
      AND room_record.owner_user_id = viewer_uuid;
  END IF;

  IF room_record.group_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO group_record
  FROM public.groups
  WHERE id = room_record.group_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF viewer_uuid IS NOT NULL THEN
    SELECT * INTO membership_record
    FROM public.group_memberships
    WHERE group_id = group_record.id
      AND user_id = viewer_uuid;
  END IF;

  IF group_record.visibility = 'public' AND room_record.visibility = 'public' THEN
    RETURN TRUE;
  END IF;

  IF membership_record.user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT (
    membership_record.is_owner
    OR membership_record.can_admin
    OR membership_record.can_write
    OR membership_record.can_read
  ) THEN
    RETURN FALSE;
  END IF;

  IF room_record.visibility <> 'private' THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.room_memberships
    WHERE room_id = room_record.id
      AND user_id = viewer_uuid
  ) INTO has_room_membership;

  can_bypass_private := membership_record.is_owner
    OR membership_record.can_admin
    OR room_record.created_by = viewer_uuid;

  RETURN has_room_membership OR can_bypass_private;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.can_write_room(
  viewer_uuid UUID,
  room_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  room_record public.rooms%ROWTYPE;
  group_record public.groups%ROWTYPE;
  membership_record public.group_memberships%ROWTYPE;
  has_room_membership BOOLEAN := FALSE;
  can_bypass_private BOOLEAN := FALSE;
  is_viewer_anonymous BOOLEAN := FALSE;
BEGIN
  IF viewer_uuid IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT COALESCE(is_anonymous, FALSE)
  INTO is_viewer_anonymous
  FROM auth.users
  WHERE id = viewer_uuid;

  IF is_viewer_anonymous THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO room_record
  FROM public.rooms
  WHERE id = room_uuid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF room_record.kind = 'personal' THEN
    RETURN room_record.owner_user_id = viewer_uuid;
  END IF;

  IF room_record.group_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO group_record
  FROM public.groups
  WHERE id = room_record.group_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO membership_record
  FROM public.group_memberships
  WHERE group_id = group_record.id
    AND user_id = viewer_uuid;

  IF membership_record.user_id IS NULL THEN
    RETURN group_record.visibility = 'public'
      AND room_record.visibility = 'public';
  END IF;

  IF NOT (
    membership_record.is_owner
    OR membership_record.can_admin
    OR membership_record.can_write
  ) THEN
    RETURN FALSE;
  END IF;

  IF room_record.visibility <> 'private' THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.room_memberships
    WHERE room_id = room_record.id
      AND user_id = viewer_uuid
  ) INTO has_room_membership;

  can_bypass_private := membership_record.is_owner
    OR membership_record.can_admin
    OR room_record.created_by = viewer_uuid;

  RETURN has_room_membership OR can_bypass_private;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth, pg_catalog;

GRANT EXECUTE ON FUNCTION public.can_read_room(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_read_room(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_room(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_write_room(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_room(UUID, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.search_chat_users(
  viewer_uuid UUID,
  search_query TEXT DEFAULT NULL,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  last_seen_at TIMESTAMPTZ
) AS $$
BEGIN
  IF viewer_uuid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    COALESCE(
      au.raw_user_meta_data->>'display_name',
      au.raw_user_meta_data->>'full_name',
      au.email,
      'Anonymous User'
    ) AS display_name,
    au.raw_user_meta_data->>'avatar_url' AS avatar_url,
    au.email,
    au.last_sign_in_at
  FROM auth.users AS au
  WHERE au.is_anonymous IS NOT TRUE
    AND au.id <> viewer_uuid
    AND (
      search_query IS NULL
      OR search_query = ''
      OR COALESCE(au.raw_user_meta_data->>'display_name', '') ILIKE '%' || search_query || '%'
      OR COALESCE(au.raw_user_meta_data->>'full_name', '') ILIKE '%' || search_query || '%'
      OR COALESCE(au.email, '') ILIKE '%' || search_query || '%'
    )
  ORDER BY
    COALESCE(
      au.raw_user_meta_data->>'display_name',
      au.raw_user_meta_data->>'full_name',
      au.email,
      ''
    ) ASC
  LIMIT GREATEST(1, LEAST(COALESCE(max_results, 20), 100));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.get_chat_user_profiles(user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  last_seen_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    COALESCE(
      au.raw_user_meta_data->>'display_name',
      au.raw_user_meta_data->>'full_name',
      au.email,
      'Anonymous User'
    ) AS display_name,
    au.raw_user_meta_data->>'avatar_url' AS avatar_url,
    au.email,
    au.last_sign_in_at
  FROM auth.users AS au
  WHERE au.id = ANY(COALESCE(user_ids, ARRAY[]::UUID[]))
  ORDER BY
    COALESCE(
      au.raw_user_meta_data->>'display_name',
      au.raw_user_meta_data->>'full_name',
      au.email,
      ''
    ) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth, pg_catalog;

GRANT EXECUTE ON FUNCTION public.search_chat_users(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_chat_users(UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_chat_user_profiles(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chat_user_profiles(UUID[]) TO service_role;

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_personalization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_usage_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_file_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_file_processing_buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public groups are readable by everyone" ON public.groups;
CREATE POLICY "Public groups are readable by everyone"
ON public.groups
FOR SELECT
TO anon, authenticated
USING (
  visibility = 'public'
  OR EXISTS (
    SELECT 1
    FROM public.group_memberships
    WHERE group_id = groups.id
      AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Non-anonymous users can create groups" ON public.groups;
CREATE POLICY "Non-anonymous users can create groups"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND NOT public.is_anonymous_user()
);

DROP POLICY IF EXISTS "Group owners and admins can update groups" ON public.groups;
CREATE POLICY "Group owners and admins can update groups"
ON public.groups
FOR UPDATE
TO authenticated
USING (
  NOT public.is_anonymous_user()
  AND EXISTS (
    SELECT 1
    FROM public.group_memberships
    WHERE group_id = groups.id
      AND user_id = auth.uid()
      AND (is_owner OR can_admin)
  )
)
WITH CHECK (
  NOT public.is_anonymous_user()
  AND EXISTS (
    SELECT 1
    FROM public.group_memberships
    WHERE group_id = groups.id
      AND user_id = auth.uid()
      AND (is_owner OR can_admin)
  )
);

DROP POLICY IF EXISTS "Only group owners can delete groups" ON public.groups;
CREATE POLICY "Only group owners can delete groups"
ON public.groups
FOR DELETE
TO authenticated
USING (
  NOT public.is_anonymous_user()
  AND EXISTS (
    SELECT 1
    FROM public.group_memberships
    WHERE group_id = groups.id
      AND user_id = auth.uid()
      AND is_owner
  )
);

DROP POLICY IF EXISTS "Members and admins can read group memberships" ON public.group_memberships;
CREATE POLICY "Members and admins can read group memberships"
ON public.group_memberships
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.group_memberships AS gm
    WHERE gm.group_id = group_memberships.group_id
      AND gm.user_id = auth.uid()
      AND (gm.is_owner OR gm.can_admin)
  )
);

DROP POLICY IF EXISTS "Group admins can insert memberships" ON public.group_memberships;
CREATE POLICY "Group admins can insert memberships"
ON public.group_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  NOT public.is_anonymous_user()
  AND EXISTS (
    SELECT 1
    FROM public.group_memberships AS gm
    WHERE gm.group_id = group_memberships.group_id
      AND gm.user_id = auth.uid()
      AND (gm.is_owner OR gm.can_admin)
  )
);

DROP POLICY IF EXISTS "Group admins can update memberships" ON public.group_memberships;
CREATE POLICY "Group admins can update memberships"
ON public.group_memberships
FOR UPDATE
TO authenticated
USING (
  NOT public.is_anonymous_user()
  AND EXISTS (
    SELECT 1
    FROM public.group_memberships AS gm
    WHERE gm.group_id = group_memberships.group_id
      AND gm.user_id = auth.uid()
      AND (gm.is_owner OR gm.can_admin)
  )
)
WITH CHECK (
  NOT public.is_anonymous_user()
  AND EXISTS (
    SELECT 1
    FROM public.group_memberships AS gm
    WHERE gm.group_id = group_memberships.group_id
      AND gm.user_id = auth.uid()
      AND (gm.is_owner OR gm.can_admin)
  )
);

DROP POLICY IF EXISTS "Group admins can delete memberships" ON public.group_memberships;
CREATE POLICY "Group admins can delete memberships"
ON public.group_memberships
FOR DELETE
TO authenticated
USING (
  NOT public.is_anonymous_user()
  AND EXISTS (
    SELECT 1
    FROM public.group_memberships AS gm
    WHERE gm.group_id = group_memberships.group_id
      AND gm.user_id = auth.uid()
      AND (gm.is_owner OR gm.can_admin)
  )
);

DROP POLICY IF EXISTS "Readable rooms are visible to anon users" ON public.rooms;
CREATE POLICY "Readable rooms are visible to anon users"
ON public.rooms
FOR SELECT
TO anon
USING (public.can_read_room(NULL, id));

DROP POLICY IF EXISTS "Readable rooms are visible to authenticated users" ON public.rooms;
CREATE POLICY "Readable rooms are visible to authenticated users"
ON public.rooms
FOR SELECT
TO authenticated
USING (public.can_read_room(auth.uid(), id));

DROP POLICY IF EXISTS "Non-anonymous users can create rooms" ON public.rooms;
CREATE POLICY "Non-anonymous users can create rooms"
ON public.rooms
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND NOT public.is_anonymous_user()
  AND (
    (
      kind = 'personal'
      AND owner_user_id = auth.uid()
      AND group_id IS NULL
      AND visibility = 'private'
    ) OR (
      kind = 'group'
      AND group_id IS NOT NULL
      AND owner_user_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.groups AS g
        LEFT JOIN public.group_memberships AS gm
          ON gm.group_id = g.id
         AND gm.user_id = auth.uid()
        WHERE g.id = rooms.group_id
          AND (
            (g.visibility = 'public' AND rooms.visibility = 'public')
            OR COALESCE(gm.is_owner, FALSE)
            OR COALESCE(gm.can_admin, FALSE)
            OR COALESCE(gm.can_write, FALSE)
          )
      )
    )
  )
);

DROP POLICY IF EXISTS "Non-anonymous users can update rooms they control" ON public.rooms;
CREATE POLICY "Non-anonymous users can update rooms they control"
ON public.rooms
FOR UPDATE
TO authenticated
USING (
  NOT public.is_anonymous_user()
  AND (
    owner_user_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.group_memberships
      WHERE group_id = rooms.group_id
        AND user_id = auth.uid()
        AND (is_owner OR can_admin)
    )
  )
)
WITH CHECK (
  NOT public.is_anonymous_user()
  AND (
    owner_user_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.group_memberships
      WHERE group_id = rooms.group_id
        AND user_id = auth.uid()
        AND (is_owner OR can_admin)
    )
  )
);

DROP POLICY IF EXISTS "Non-anonymous users can delete rooms they control" ON public.rooms;
CREATE POLICY "Non-anonymous users can delete rooms they control"
ON public.rooms
FOR DELETE
TO authenticated
USING (
  NOT public.is_anonymous_user()
  AND (
    owner_user_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.group_memberships
      WHERE group_id = rooms.group_id
        AND user_id = auth.uid()
        AND (is_owner OR can_admin)
    )
  )
);

DROP POLICY IF EXISTS "Room members can read room memberships" ON public.room_memberships;
CREATE POLICY "Room members can read room memberships"
ON public.room_memberships
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.rooms AS r
    JOIN public.group_memberships AS gm
      ON gm.group_id = r.group_id
    WHERE r.id = room_memberships.room_id
      AND gm.user_id = auth.uid()
      AND (gm.is_owner OR gm.can_admin)
  )
  OR EXISTS (
    SELECT 1
    FROM public.rooms AS r
    WHERE r.id = room_memberships.room_id
      AND r.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Room managers can insert room memberships" ON public.room_memberships;
CREATE POLICY "Room managers can insert room memberships"
ON public.room_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  NOT public.is_anonymous_user()
  AND EXISTS (
    SELECT 1
    FROM public.rooms AS r
    JOIN public.group_memberships AS gm
      ON gm.group_id = r.group_id
    WHERE r.id = room_memberships.room_id
      AND (
        r.created_by = auth.uid()
        OR (
          gm.user_id = auth.uid()
          AND (gm.is_owner OR gm.can_admin)
        )
      )
  )
);

DROP POLICY IF EXISTS "Room managers can delete room memberships" ON public.room_memberships;
CREATE POLICY "Room managers can delete room memberships"
ON public.room_memberships
FOR DELETE
TO authenticated
USING (
  NOT public.is_anonymous_user()
  AND EXISTS (
    SELECT 1
    FROM public.rooms AS r
    JOIN public.group_memberships AS gm
      ON gm.group_id = r.group_id
    WHERE r.id = room_memberships.room_id
      AND (
        r.created_by = auth.uid()
        OR (
          gm.user_id = auth.uid()
          AND (gm.is_owner OR gm.can_admin)
        )
      )
  )
);

DROP POLICY IF EXISTS "Users can read their own AI personalization settings" ON public.user_ai_personalization_settings;
CREATE POLICY "Users can read their own AI personalization settings"
ON public.user_ai_personalization_settings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND NOT public.is_anonymous_user()
);

DROP POLICY IF EXISTS "Users can insert their own AI personalization settings" ON public.user_ai_personalization_settings;
CREATE POLICY "Users can insert their own AI personalization settings"
ON public.user_ai_personalization_settings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND NOT public.is_anonymous_user()
);

DROP POLICY IF EXISTS "Users can update their own AI personalization settings" ON public.user_ai_personalization_settings;
CREATE POLICY "Users can update their own AI personalization settings"
ON public.user_ai_personalization_settings
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND NOT public.is_anonymous_user()
)
WITH CHECK (
  user_id = auth.uid()
  AND NOT public.is_anonymous_user()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'groups'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.groups';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'group_memberships'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.group_memberships';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'rooms'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'room_memberships'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.room_memberships';
  END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
