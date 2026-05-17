// Playbook hooks — wired to Supabase once auth + DB are configured.
// For now, returns local store data (placeholder).
export function usePlaybookRules() {
  return { rules: [], loading: false };
}
