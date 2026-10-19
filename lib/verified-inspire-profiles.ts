/**
 * Stable, verified INSPIRE identities for curated SAM researchers.
 *
 * The external Google Doc describes a member's editable biography, but must not
 * remove a verified INSPIRE identity when its INSPIRE field is omitted.
 */
const VERIFIED_INSPIRE_CONTROL_NUMBERS: Readonly<Record<string, string>> = {
  "mahbubul-alam-majumdar": "1023635",
  "syed-hasibul-hassan-chowdhury": "1511186",
  "ahmed-rakin-kamal": "2763317",
  "sayeda-tashnuba-jahan": "3088919",
  "mishaal-hai": "2931658",
  "md-shaikot-jahan-shuvo": "2648798",
};

export function verifiedInspireUrlForSlug(slug?: string | null): string | null {
  const authorId = slug ? VERIFIED_INSPIRE_CONTROL_NUMBERS[slug] : undefined;
  return authorId
    ? `https://inspirehep.net/authors/${authorId}?ui-citation-summary=true`
    : null;
}

/** For curated researchers the verified identity wins over an empty/stale Drive field. */
export function resolveInspireUrl(
  profileUrl?: string | null,
  slug?: string | null,
): string | null {
  return verifiedInspireUrlForSlug(slug) || profileUrl?.trim() || null;
}
