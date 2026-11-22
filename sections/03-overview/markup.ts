/* Static markup for section 03 (overview). Edit text here. */
export const OVERVIEW_MARKUP = String.raw`
  <header class="ov-head">
    <span class="ov-kicker">For solid and pneumatic tyre plants</span>
    <h2 id="ov-title"><span class="ln"><span>Process intelligence</span></span><span class="ln"><span>for every tyre line.</span></span></h2>
    <p>Today a tyre's history lives on paper, so a defect, a claim or an audit takes days to answer. Tyode gives every tyre, solid or pneumatic, a Digital Passport from the moment it is built, and turns what the line records into decisions your team can act on.</p>
  </header>

  <div class="ov-cmp">
    <h3 class="ov-sub"><span class="ln"><span>From paper to proof.</span></span></h3>
    <div class="ov-cmp-card">
      <table>
        <caption class="ov-sr">How a tyre plant works today, compared with Tyode</caption>
        <thead><tr><th scope="col">Today</th><th scope="col">With Tyode</th></tr></thead>
        <tbody>
          <tr><td data-label="Today">Green tyres are counted by hand at the end of a shift</td><td data-label="With Tyode">Every tyre is counted by the machine the moment it is built</td></tr>
          <tr><td data-label="Today">A tyre's history is spread across paper forms</td><td data-label="With Tyode">One scan opens its full Digital Passport</td></tr>
          <tr><td data-label="Today">Defect causes are debated from experience</td><td data-label="With Tyode">Likely causes are ranked by statistical evidence, every source cited</td></tr>
          <tr><td data-label="Today">A suspect batch means searching records for days</td><td data-label="With Tyode">Every affected tyre is found and held in one action</td></tr>
          <tr><td data-label="Today">Questions go to whoever kept the paperwork</td><td data-label="With Tyode">Anyone can ask Tyode in plain language</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="ov-desks">
    <h3 class="ov-sub"><span class="ln"><span>Built for every desk in the plant.</span></span></h3>
    <div class="ov-grid">
      <article class="ov-tile">
        <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 30a14 14 0 0 1 28 0"/><path d="M20 30l7-9"/><circle cx="20" cy="30" r="2.2" class="dot"/></svg>
        <span class="ov-eb">Production</span><h3>Scrap cost, press time and claims, in one view.</h3><p>The numbers a production director asks for each morning, with build counts taken from the machines instead of end-of-shift paperwork.</p>
      </article>
      <article class="ov-tile">
        <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="13"/><path d="M13.5 20.5l4.5 4.5 8.5-9"/></svg>
        <span class="ov-eb">Quality</span><h3>Every inspection kept, and the right tyres checked first.</h3><p>Readings from the plant's scales and gauges stay with each tyre. On solid lines, doubtful cures are flagged for ultrasound.</p>
      </article>
      <article class="ov-tile">
        <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 31c7-1 10-14 17-16s9 4 13 2"/><circle cx="22" cy="15" r="2.4" class="sig"/></svg>
        <span class="ov-eb">Process engineering</span><h3>Leads, not guesses.</h3><p>Defects compared across building machines, presses, moulds, compound batches and cure curves, with sample sizes shown.</p>
      </article>
      <article class="ov-tile">
        <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="12" width="30" height="18" rx="2"/><path d="M11 12v18M17 12v18M23 12v18M29 12v18"/></svg>
        <span class="ov-eb">Sales and export</span><h3>A tyre's full history when a buyer asks.</h3><p>One scan answers a claim or an audit, months after the container has left the port.</p>
      </article>
    </div>
  </div>

  <div class="ov-floor">
    <h3><span class="ln"><span>Engineered for</span></span><span class="ln"><span>the plant floor.</span></span></h3>
    <ul>
      <li><b>Shadow mode</b><span>Runs beside the current process until results are proven.</span></li>
      <li><b>Read-only</b><span>Nothing connects to machine controls.</span></li>
      <li><b>On-site</b><span>Data stays on the plant's own server.</span></li>
      <li><b>Station by station</b><span>Paper is retired one station at a time, only when you approve.</span></li>
    </ul>
  </div>

  <div class="ov-close">
    <a class="ov-next" href="#how-it-works">See how it works <i aria-hidden="true">&darr;</i></a>
    <p class="ov-note">Tyode is in development. A pilot on a pneumatic line is being agreed with a Sri Lankan tyre maker.</p>
  </div>
`;
