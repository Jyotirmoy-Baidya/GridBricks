import type { BandsBasis } from '@/types/api'

/** Says where the range, count-on line and adjustment came from, so nobody reads them as a guarantee. */
export default function BandsBasisNote({ basis }: { basis: BandsBasis | null | undefined }) {
  if (basis === 'recent') {
    return <>The range, count-on line and bias adjustment are learned from forecast errors in the 30 days before this day, so they have not seen it. See Accuracy › Reliability for how well that holds.</>
  }
  if (basis === 'all_history') {
    return <>There is under a week of earlier data, so the range, count-on line and bias adjustment are learned from all loaded data, including this day (in-sample). Treat them as a rough guide.</>
  }
  return <>The range and count-on line come from past forecast errors at the same horizon.</>
}
