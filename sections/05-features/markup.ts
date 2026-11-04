/* Static markup for the features section: copy, scene SVGs and the screen.
   Edit text here. Scenes are concept visuals with sample data. */
export const FEATURES_MARKUP = String.raw`

  <!-- scene templates (one SVG per feature), cloned into the desktop screen and the mobile cards -->
  <template id="ft-scenes">
    <!-- 01 PASSPORT -->
    <div class="sc" data-s="0"><svg viewBox="0 0 800 460" aria-hidden="true">
      <g class="dm" id="ft-dm"></g>
      <g class="pop" style="--d:.15s"><text x="226" y="62">Tyre ID · on the steel band</text>
      <text x="226" y="114" class="tx-ink" style="font-size:44px;letter-spacing:.04em;font-weight:500">P1-2611-00427</text></g>
      <line class="hl" x1="80" y1="250" x2="720" y2="250"/>
      <line class="ln draw" style="--len:640;--d:.4s" x1="80" y1="250" x2="720" y2="250"/>
      <g>
        <circle class="node" style="--d:.5s" cx="80" cy="250" r="9"/><circle class="node" style="--d:.7s" cx="171" cy="250" r="9"/>
        <circle class="node" style="--d:.9s" cx="263" cy="250" r="9"/><circle class="node" style="--d:1.1s" cx="354" cy="250" r="9"/>
        <circle class="node" style="--d:1.3s" cx="446" cy="250" r="9"/><circle class="node" style="--d:1.5s" cx="537" cy="250" r="9"/>
        <circle class="node" style="--d:1.7s" cx="629" cy="250" r="9"/><circle class="node" style="--d:1.9s" cx="720" cy="250" r="9"/>
      </g>
      <g class="pop" style="--d:.5s"><text x="80" y="292" text-anchor="middle">Material</text></g>
      <g class="pop" style="--d:.7s"><text x="171" y="222" text-anchor="middle">Compound</text></g>
      <g class="pop" style="--d:.9s"><text x="263" y="292" text-anchor="middle" class="tx-ink">Band</text></g>
      <g class="pop" style="--d:1.1s"><text x="354" y="222" text-anchor="middle">Layers</text></g>
      <g class="pop" style="--d:1.3s"><text x="446" y="292" text-anchor="middle">Cure</text></g>
      <g class="pop" style="--d:1.5s"><text x="537" y="222" text-anchor="middle">Check</text></g>
      <g class="pop" style="--d:1.7s"><text x="629" y="292" text-anchor="middle">Container</text></g>
      <g class="pop" style="--d:1.9s"><text x="720" y="222" text-anchor="middle">Customer</text></g>
      <g class="pop" style="--d:2.1s"><text x="400" y="360" text-anchor="middle" class="tx-ink">Base · cushion · tread, each linked to its batch</text></g>
    </svg></div>

    <!-- 02 CONTAINMENT -->
    <div class="sc" data-s="1"><svg viewBox="0 0 800 460" aria-hidden="true">
      <g class="pop" style="--d:.1s"><rect x="40" y="190" width="190" height="80" rx="16" fill="none" class="s-sig" stroke-width="1.6"/>
      <text x="60" y="222" class="tx-sig">Batch flagged</text><text x="60" y="250" class="tx-ink" style="font-size:16px;letter-spacing:.02em">Cushion C-1030-11</text></g>
      <path class="ln draw" style="--len:560;--d:.4s" d="M230 230 H290 M290 230 V110 H312 M290 230 V350 H312 M290 230 H312"/>
      <g class="pop" style="--d:.7s"><text x="318" y="82">In work in progress · 12</text></g>
      <g class="pop" style="--d:.8s"><text x="318" y="190">In the warehouse · 26</text></g>
      <g class="pop" style="--d:.9s"><text x="318" y="322" class="tx-sig">Loaded for export, order EX-2611 · 8</text></g>
      <g id="ft-dots"></g>
      <g class="pop" style="--d:1.9s"><rect x="560" y="388" width="180" height="48" rx="24" class="f-sig"/>
      <text x="650" y="417" text-anchor="middle" style="fill:#0c0c0d;font-weight:600">Hold all 46</text></g>
    </svg></div>

    <!-- 03 QUALITY CHECK -->
    <div class="sc" data-s="2"><svg viewBox="0 0 800 460" aria-hidden="true">
      <g class="pop" style="--d:.1s"><rect class="hl" x="60" y="24" width="330" height="176" rx="16"/><text x="82" y="52">Ultrasound A-scan</text>
        <path class="ln draw" style="--len:560;--d:.4s" d="M82 176 H140 L146 96 L152 176 H230 L236 140 L242 176 H300 L306 150 L312 176 H368"/></g>
      <g class="pop" style="--d:1.3s"><circle cx="236" cy="140" r="11" fill="none" class="s-sig" stroke-width="1.4"/><text x="254" y="126" class="tx-sig">Void</text></g>
      <g class="pop" style="--d:.25s"><rect class="hl" x="410" y="24" width="330" height="176" rx="16"/><text x="432" y="52">Weight vs target</text>
        <text x="432" y="110" class="tx-ink" style="font-size:34px;letter-spacing:0;text-transform:none;font-weight:500">+0.4 kg</text>
        <rect class="hl" x="432" y="144" width="286" height="8" rx="4"/>
        <line x1="560" y1="134" x2="560" y2="162" stroke="#f2f2f3" stroke-width="1.4"/>
        <text x="560" y="182" text-anchor="middle">Target for this size</text></g>
      <g class="pop" style="--d:1.1s"><circle cx="594" cy="148" r="7" class="f-sig"/><text x="718" y="108" text-anchor="end" class="tx-sig">Rubber giveaway</text></g>
      <g class="pop" style="--d:.4s"><rect class="hl" x="60" y="220" width="330" height="124" rx="16"/><text x="82" y="248">Hardness · Shore A</text>
        <text x="82" y="280">Tread</text><rect x="180" y="271" width="144" height="10" rx="5" fill="#3a3a3e"/><text x="370" y="280" text-anchor="end" class="tx-ink">72</text>
        <text x="82" y="304">Cushion</text><rect x="180" y="295" width="126" height="10" rx="5" fill="#3a3a3e"/><text x="370" y="304" text-anchor="end" class="tx-ink">63</text>
        <text x="82" y="328">Base</text><rect x="180" y="319" width="172" height="10" rx="5" fill="#3a3a3e"/><text x="370" y="328" text-anchor="end" class="tx-ink" dx="0">86</text></g>
      <g class="pop" style="--d:.55s"><rect class="hl" x="410" y="220" width="330" height="124" rx="16"/><text x="432" y="248">Dimensions · mm · 18×6×12⅛</text>
        <text x="432" y="280">Outer diameter</text><text x="718" y="280" text-anchor="end" class="tx-ink">457.6</text>
        <text x="432" y="304">Band bore</text><text x="718" y="304" text-anchor="end" class="tx-ink">308.1</text>
        <text x="432" y="328">Width</text><text x="718" y="328" text-anchor="end" class="tx-ink">152.9</text></g>
      <g class="pop" style="--d:.8s"><rect class="tile" x="60" y="368" width="206" height="52" rx="26"/><text x="163" y="399" text-anchor="middle" class="tx-ink">Pass</text></g>
      <g class="pop" style="--d:.9s"><rect class="tile pick" x="297" y="368" width="206" height="52" rx="26"/><text x="400" y="399" text-anchor="middle" class="tx-ink">Suspect</text></g>
      <g class="pop" style="--d:1s"><rect class="tile" x="534" y="368" width="206" height="52" rx="26"/><text x="637" y="399" text-anchor="middle" class="tx-ink">Fail</text></g>
    </svg></div>

    <!-- 04 DRIFT -->
    <div class="sc" data-s="3"><svg viewBox="0 0 800 460" aria-hidden="true">
      <g class="pop" style="--d:1.6s">
        <rect x="150" y="16" width="500" height="80" rx="20" fill="#18181a" class="s-sig" stroke-opacity=".6"/>
        <circle cx="184" cy="56" r="7" class="f-sig"/>
        <text x="204" y="48" class="tx-sig">Drift alert · Build line B2</text>
        <text x="204" y="76" class="tx-ink" style="font-size:16px;letter-spacing:0;text-transform:none">Weight is trending heavy. Every tyre still passes.</text>
      </g>
      <line class="lim" x1="80" y1="150" x2="730" y2="150"/><text x="80" y="140">Upper limit</text>
      <line class="hl" x1="80" y1="270" x2="730" y2="270"/><text x="730" y="292" text-anchor="end">Target weight</text>
      <line class="lim" x1="80" y1="390" x2="730" y2="390"/><text x="80" y="414">Lower limit</text>
      <path class="ln draw" id="ft-spc-line" style="--len:1400;--d:.2s" d=""/>
      <g id="ft-spc"></g>
      <g class="pop" style="--d:1.4s"><text x="730" y="440" text-anchor="end">Last 40 tyres, build line B2</text></g>
    </svg></div>

    <!-- 05 CORE CURE -->
    <div class="sc" data-s="4"><svg viewBox="0 0 800 460" aria-hidden="true">
      <text x="80" y="48">Temperature</text>
      <line class="hl" x1="80" y1="60" x2="80" y2="360"/><line class="hl" x1="80" y1="360" x2="560" y2="360"/>
      <text x="560" y="388" text-anchor="end">Cure time</text>
      <path class="ln draw" style="--len:700;--d:.3s" d="M80 340 C120 140 170 104 240 100 L560 100"/>
      <path class="core draw" style="--len:620;--d:.9s" d="M80 340 C220 336 330 220 420 170 S520 140 560 136"/>
      <g class="pop" style="--d:1s"><text x="300" y="88" class="tx-ink">Mould surface, logged</text></g>
      <g class="pop" style="--d:2s"><text x="446" y="208" class="tx-sig">Core, estimated</text></g>
      <text x="648" y="66" text-anchor="middle">State of cure</text>
      <rect class="hl" x="620" y="80" width="56" height="280" rx="10"/>
      <rect class="bar f-sig" style="--d:1.8s" x="620" y="119" width="56" height="241" rx="10"/>
      <line x1="608" y1="94" x2="688" y2="94" stroke="#f2f2f3" stroke-width="1.4"/>
      <text x="694" y="98">Target</text>
      <g class="pop" style="--d:2.4s"><text x="648" y="388" text-anchor="middle" class="tx-sig">Core 86%, est.</text></g>
      <g class="pop" style="--d:2.6s"><text x="80" y="420">Surface curve looked normal · tyre sent to ultrasound first</text></g>
    </svg></div>

    <!-- 06 PROCESS CLUES + COST -->
    <div class="sc" data-s="5"><svg viewBox="0 0 800 460" aria-hidden="true">
      <g class="pop" style="--d:.2s">
        <rect x="150" y="16" width="500" height="92" rx="20" fill="#18181a" stroke="#f2f2f3" stroke-opacity=".14"/>
        <text x="178" y="50">Scrap and rework cost · this week</text>
        <text x="178" y="88" class="tx-ink" style="font-size:24px;letter-spacing:0;text-transform:none;font-weight:500">LKR 412,000</text>
      </g>
      <text x="150" y="168">Void rate by press · sample size shown</text>
      <line class="hl" x1="150" y1="400" x2="650" y2="400"/>
      <rect class="bar" style="--d:.6s" x="170" y="340" width="56" height="60" rx="6" fill="#3a3a3e"/>
      <rect class="bar" style="--d:.7s" x="266" y="319" width="56" height="81" rx="6" fill="#3a3a3e"/>
      <rect class="bar f-sig" style="--d:.8s" x="362" y="208" width="56" height="192" rx="6"/>
      <rect class="bar" style="--d:.9s" x="458" y="346" width="56" height="54" rx="6" fill="#3a3a3e"/>
      <rect class="bar" style="--d:1s" x="554" y="328" width="56" height="72" rx="6" fill="#3a3a3e"/>
      <g class="pop" style="--d:1.2s"><text x="198" y="330" text-anchor="middle">n=150</text><text x="294" y="309" text-anchor="middle">n=148</text><text x="390" y="198" text-anchor="middle" class="tx-ink">n=140</text><text x="486" y="336" text-anchor="middle">n=152</text><text x="582" y="318" text-anchor="middle">n=146</text></g>
      <text x="198" y="426" text-anchor="middle">P-01</text><text x="294" y="426" text-anchor="middle">P-02</text>
      <text x="390" y="426" text-anchor="middle" class="tx-sig">P-03</text><text x="486" y="426" text-anchor="middle">P-04</text><text x="582" y="426" text-anchor="middle">P-05</text>
      <g class="pop" style="--d:1.5s"><text x="432" y="240" class="tx-ink">Worth checking: cure dips</text><text x="432" y="260" class="tx-ink">at minute 14 on P-03</text></g>
    </svg></div>
  </template>

  <!-- intro -->
  <header class="ft-intro">
    <div class="ft-kicker"><span>Features</span><span>Trace · Check · Explain</span></div>
    <h2 class="ft-h" id="ft-title"><span class="ln"><span>One passport.</span></span><span class="ln"><span>Every tyre explained.</span></span></h2>
    <p class="ft-lede">Tyode records where every solid tyre came from, what its checks found, and why the bad ones failed. It runs on the presses and instruments the plant already has, without slowing the line.</p>
  </header>

  <!-- pinned scroll stage -->
  <div class="ft-scroll">
    <div class="ft-stage" id="ft-stage">
      <div class="ft-copy">
        <div class="ft-module" id="ft-module"><b>Trace</b><i>Where</i></div>

        <div class="ft-items">
          <span class="ft-index" id="ft-index" aria-hidden="true">01</span>

          <article class="ft-item" data-i="0">
            <h3><span class="ln"><span>One tyre.</span></span><span class="ln"><span>One passport.</span></span></h3>
            <p>A cure-proof ID on the steel band. Every stage adds itself with one scan, from each layer's compound batch to the export container.</p>
            <ul><li>Per-layer batches</li><li>One scan per stage</li><li>Works offline</li></ul>
          </article>
          <article class="ft-item" data-i="1">
            <h3><span class="ln"><span>Contain a bad batch</span></span><span class="ln"><span>in one click.</span></span></h3>
            <p>Flag a batch, band or press and see every tyre it touched: in work in progress, in the warehouse, or already in a container. Hold them all at once.</p>
            <ul><li>Trace back and forward</li><li>Container level</li><li>Claim lookup in seconds</li></ul>
          </article>
          <article class="ft-item" data-i="2">
            <h3><span class="ln"><span>Every check,</span></span><span class="ln"><span>on the record.</span></span></h3>
            <p>Ultrasound verdict, weight, hardness per layer and dimensions are saved against the tyre. The plant's own instruments measure; the inspector decides.</p>
            <ul><li>Ultrasound</li><li>Weight vs target</li><li>Shore A per layer</li></ul>
          </article>
          <article class="ft-item" data-i="3">
            <h3><span class="ln"><span>Catch the drift</span></span><span class="ln"><span>before the scrap.</span></span></h3>
            <p>Statistical rules watch weight, hardness and size by build line, mould and press. A drift toward a limit raises an alert while every tyre still passes.</p>
            <ul><li>Drift alerts</li><li>Rubber giveaway</li><li>Supervisor alerts</li></ul>
          </article>
          <article class="ft-item" data-i="4">
            <h3><span class="ln"><span>See the core</span></span><span class="ln"><span>the surface hides.</span></span></h3>
            <p>Thick rubber cures from the outside in. Tyode turns each press's temperature log into an estimate of how well the core cured, checked first against a thermocouple inside a test tyre, and sends doubtful tyres to ultrasound first.</p>
            <ul><li>Press loggers</li><li>Validated model</li><li>Risk-based checks</li></ul>
          </article>
          <article class="ft-item" data-i="5">
            <h3><span class="ln"><span>Find the cause,</span></span><span class="ln"><span>not someone to blame.</span></span></h3>
            <p>Defect rates are compared across presses, moulds, batches and cure curves, with sample sizes shown. Engineers get a lead to check, and the cost in rupees.</p>
            <ul><li>Process clues</li><li>Cost of poor quality</li><li>Mould life</li></ul>
          </article>
        </div>

        <div class="ft-rulebox" aria-hidden="true">
          <div class="ft-groups"><span id="ft-g0" class="on">Trace</span><span id="ft-g1">Check</span><span id="ft-g2">Explain</span></div>
          <span class="ft-rule"><i class="ft-tick" style="left:33.333%"></i><i class="ft-tick" style="left:66.667%"></i><span class="ft-marker"></span></span>
          <ol class="ft-names">
            <li style="--i:0"><button data-go="0" tabindex="-1">Passport</button></li>
            <li style="--i:.2"><button data-go="1" tabindex="-1">Containment</button></li>
            <li style="--i:.4"><button data-go="2" tabindex="-1">Checks</button></li>
            <li style="--i:.6"><button data-go="3" tabindex="-1">Drift</button></li>
            <li style="--i:.8"><button data-go="4" tabindex="-1">Core cure</button></li>
            <li style="--i:1"><button data-go="5" tabindex="-1">Clues</button></li>
          </ol>
        </div>
      </div>

      <div class="ft-screen" id="ft-screen" aria-hidden="true">
        <div class="ft-hud"><span class="rec"><i></i><span id="ft-hud-l">Trace / Passport</span></span><span class="clk"><span id="ft-clock">Pilot line · 02:14:09</span><span id="ft-hud-r">01 / 06</span></span></div>
        <div id="ft-scenes-desk"></div>
        <div class="ft-bloom"></div><div class="ft-sheen"></div><div class="ft-prog"><i></i></div>
        <div class="ft-foot"><div class="ft-readout" id="ft-readout"><small>Passport</small><b>8</b> of 8 stages</div><span>Concept visual · sample data</span></div>
      </div>

      <!-- mobile / reduced motion: stacked cards (filled by script) -->
      <div class="ft-mob" id="ft-mob"></div>
    </div>
  </div>

  <!-- closing -->
  <div class="ft-close">
    <h2>Every tyre traced.<br><span>Every defect explained.</span></h2>
    <a class="ft-cta" href="#footer">Book a walkthrough <i aria-hidden="true">&rarr;</i></a>
    <p class="ft-note">Tyode is in development, with a one-line pilot planned. Visuals are concept previews with sample data.</p>
  </div>
`;
