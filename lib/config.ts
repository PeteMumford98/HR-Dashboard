// Feature flags for running as a self-contained prototype.
// Any secret left as its .env.example placeholder (or unset) counts as "not configured".

function isSet(value: string | undefined) {
  return !!value && !value.startsWith("YOUR_");
}

export function isSupabaseConfigured() {
  return (
    isSet(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    isSet(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function isClaudeConfigured() {
  return isSet(process.env.ANTHROPIC_API_KEY);
}
