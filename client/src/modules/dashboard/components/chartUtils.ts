/** "2026-11-03" -> "03/11" */
export const dayLabel = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};
