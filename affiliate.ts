/**
 * Forwards the URL tail (e.g. /test, /1) into the affiliate link's s1 source.
 * yoursite.com/test  ->  <base>?s1=test
 */
export const AFFILIATE_BASE =
  "https://taprkr.com/r/eyJ0IjoicmVjb3NvY2lhbC1jcHIiLCJ0aWQiOiI0NGFlZGU2OTY1YzgxYjMzMzRkZiIsInRzIjoxNzkzMTQ2NTE2NjMzfQ?s1=";

export function affiliateUrl(): string {
  let tail = window.location.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  try {
    tail = decodeURIComponent(tail);
  } catch {
    /* leave as-is */
  }
  tail = tail
    .replace(/\.html$/i, "")
    .replace(/[^A-Za-z0-9._-]/g, "")
    .slice(0, 60);
  return AFFILIATE_BASE + encodeURIComponent(tail);
}