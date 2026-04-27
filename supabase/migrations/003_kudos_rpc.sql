-- Migration: 003_kudos_rpc
-- Creates the increment_kudos RPC function.
--
-- Visitors call this function to increment the aggregate kudos count for a
-- photo or blog post. The function runs as SECURITY DEFINER so it can bypass
-- the RLS policy that blocks direct client writes to the kudos table.

CREATE OR REPLACE FUNCTION increment_kudos(p_item_id UUID, p_item_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO kudos (item_id, item_type, count)
  VALUES (p_item_id, p_item_type, 1)
  ON CONFLICT (item_id, item_type)
  DO UPDATE SET count = kudos.count + 1
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;
