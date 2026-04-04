function shouldFallbackToLegacyOnConflict(error) {
  if (!error) return false;
  if (error.code === "42P10") return true;
  const msg = String(error.message ?? "");
  return msg.includes("no unique or exclusion constraint matching");
}

/**
 * Upsert `user_progress` with an onConflict target that exists in the database.
 * Tries UNIQUE (user_id, topic, area) first; if the migration was not applied,
 * Postgres returns 42P10 and we fall back to UNIQUE (user_id, topic).
 *
 * @param {{ select?: string | boolean }} [options] pass `{ select: "*" }` to chain .select() like the Supabase client
 */
export async function upsertUserProgress(supabase, rows, options = {}) {
  const payload = Array.isArray(rows) ? rows : [rows];
  const select = options.select;

  const run = (onConflict) => {
    let q = supabase.from("user_progress").upsert(payload, { onConflict });
    if (select != null && select !== false) {
      q = q.select(select === true ? "*" : select);
    }
    return q;
  };

  let result = await run("user_id,topic,area");
  if (shouldFallbackToLegacyOnConflict(result.error)) {
    result = await run("user_id,topic");
  }

  return result;
}
