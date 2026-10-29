import Card from '@/components/common/Card'

const P = 'm-0 max-w-[72ch] leading-relaxed'

export default function MethodologyPage() {
  return (
    <>
      <Card title="Which forecast counts">
        <p className={P}>
          Wind forecasts (Elexon WINDFOR) are published about eight times a day, each looking up to three days ahead. For every delivery hour the dashboard picks one forecast: the newest one published at least <strong>h hours</strong> before that hour. Forecasts published later would not have been available when the decision was made, so they are never used. If no forecast is early enough, the hour is shown as a gap and counted in coverage; it is never filled from a later forecast.
        </p>
        <p className={P}>
          The <strong>day-ahead planner</strong> uses a fixed clock time instead: the last forecast published before the cut-off (default 09:00 London) on the day before delivery. Each delivery hour then has its own effective horizon, from about 15 to 39 hours.
        </p>
      </Card>

      <Card title="How accuracy is measured">
        <p className={P}>
          Actual output comes from Elexon FUELHH (fuel type WIND). Forecasts are hourly and actuals half-hourly, so comparisons use the actual at the top of each hour. Error is <strong>forecast minus actual</strong>: positive means the forecast was too high, which leaves the desk short.
        </p>
        <ul className="m-0 flex max-w-[72ch] list-disc flex-col gap-1.5 pl-5 leading-relaxed">
          <li><strong>MAE / RMSE</strong>: typical and tail-weighted size of the miss, in MW.</li>
          <li><strong>Bias</strong>: the average signed error. A steady offset can be corrected for; random error cannot.</li>
          <li><strong>nMAE</strong>: MAE as a share of mean actual output. Used instead of MAPE, which explodes when wind is near zero.</li>
          <li><strong>P50 / P90 / P99 |error|</strong>: how large the miss is in 50%, 90% and 99% of hours. P90 is a practical buffer size.</li>
          <li><strong>Coverage</strong>: share of hours that had a forecast at this horizon.</li>
        </ul>
      </Card>

      <Card title="Count-on wind and the range">
        <p className={P}>
          For each delivery hour, the P10–P90 range and the count-on line use the distribution of past errors at the same horizon, learned from the 30 days before the day being viewed. Count-on is the forecast minus the P90 over-forecast, floored at zero: a conservative wind figure to plan purchases against. The bias-adjusted forecast removes the typical (mean) error at that horizon. With under a week of earlier data they are learned from all loaded data instead, and the page says so.
        </p>
      </Card>

      <Card title="How reliable the correction is">
        <p className={P}>
          Accuracy › Reliability tests the method honestly: it learns the error pattern on the days before a range, then scores it on the range, hours it has never seen. It reports how often the P10–P90 range held the actual (a good 80% range should hold it about 80% of the time), how often actual output reached the count-on line (target 90%), and how much the bias adjustment shrinks the error. The forecast's steady offset drifts over time, so a short learning window (14 to 30 days) tracks it better than all history; you can choose the window on that page. These ranges are guides, not guarantees.
        </p>
      </Card>

      <Card title="What would I need to buy?">
        <p className={P}>
          On the Day-ahead and Live pages you enter an expected demand in MW, held flat across the day. For each way of reading the wind forecast (as published, with the usual offset removed, or only the safe count-on wind) the page adds up the hours where demand exceeds wind. That is the power still to buy. Demand is not in the Elexon data this app is limited to, so the figure is a what-if, and surplus wind is not credited.
        </p>
      </Card>

      <Card title="Scope and assumptions">
        <ul className="m-0 flex max-w-[72ch] list-disc flex-col gap-1.5 pl-5 leading-relaxed">
          <li>National-level GB wind only, from Elexon BMRS. No demand, price or other fuel data.</li>
          <li>The loaded history runs from 30 December 2025 to the latest full day, and the date pickers allow any day in it. The January 2026 study window the brief asks for sits inside that range; the pages open on the most recent month.</li>
          <li>All times are stored in UTC and shown in Europe/London.</li>
          <li>An actual reading of 0 MW is treated as missing and dropped. National GB wind does not really fall to zero (the lowest genuine reading is about 400 MW), and the few zeros are isolated values that would otherwise show up as huge forecast misses.</li>
          <li>WINDFOR may cover wind that FUELHH does not meter, which would explain a persistent positive bias. This has not been confirmed with Elexon.</li>
        </ul>
      </Card>
    </>
  )
}
