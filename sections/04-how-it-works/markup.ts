/* Static markup for section 04 (how it works): copy, labels, passport. The 3D tyre is drawn into the canvas.
   Edit text here. Codes are sample data. */
export const HOW_IT_WORKS_MARKUP = String.raw`
  <header class="h3-intro">
    <span class="h3-eyebrow">How it works</span>
    <h2 id="h3-title"><span class="ln"><span>Eight stages.</span></span><span class="ln"><span>One scan each.</span></span></h2>
    <p>Every solid tyre gets an ID on its steel band. From there, each station adds what it knows, and the passport builds itself as the tyre moves through the plant.</p>
  </header>

  <div class="h3-scroll">
    <div class="h3-stage">
      <canvas class="h3-canvas" aria-hidden="true"></canvas>
      <div class="h3-tags" aria-hidden="true"><div class="h3-tag" data-tag="band"><i></i><span></span><div><b>Steel band</b><em>S-0412 · ID P1-2611-00427</em></div></div><div class="h3-tag" data-tag="base"><i></i><span></span><div><b>Base</b><em>B-1031-04</em></div></div><div class="h3-tag" data-tag="cush"><i></i><span></span><div><b>Cushion</b><em>C-1028-03</em></div></div><div class="h3-tag" data-tag="tread"><i></i><span></span><div><b>Tread</b><em>T-1029-07</em></div></div><div class="h3-tag" data-tag="cure"><i></i><span></span><div><b>Press P-05 · mould M-02</b><em>Cure curve logged</em></div></div><div class="h3-tag" data-tag="check"><i></i><span></span><div><b>Ultrasound · weight · hardness · size</b><em>Pass · signed QA-03</em></div></div><div class="h3-tag" data-tag="store"><i></i><span></span><div><b>Rack C4 · pallet 118</b><em>Located in one scan</em></div></div><div class="h3-tag" data-tag="ship"><i></i><span></span><div><b>Order EX-2614</b><em>Loaded for export · customer linked</em></div></div></div>
      <ol class="h3-seg" aria-hidden="true"><li style="--f:0"><button type="button" data-go="0" tabindex="-1"><i></i><span>Materials</span></button></li><li style="--f:0"><button type="button" data-go="1" tabindex="-1"><i></i><span>Compound</span></button></li><li style="--f:0"><button type="button" data-go="2" tabindex="-1"><i></i><span>Band</span></button></li><li style="--f:0"><button type="button" data-go="3" tabindex="-1"><i></i><span>Build</span></button></li><li style="--f:0"><button type="button" data-go="4" tabindex="-1"><i></i><span>Cure</span></button></li><li style="--f:0"><button type="button" data-go="5" tabindex="-1"><i></i><span>Check</span></button></li><li style="--f:0"><button type="button" data-go="6" tabindex="-1"><i></i><span>Store</span></button></li><li style="--f:0"><button type="button" data-go="7" tabindex="-1"><i></i><span>Ship</span></button></li></ol>
      <div class="h3-copy">
        <article class="h3-item">
          <span class="h3-st">01 · Receive materials</span>
          <h3><span class="ln"><span>Logged at</span></span><span class="ln"><span>the gate.</span></span></h3>
          <p>Rubber, chemicals and steel bands are recorded as they arrive, with supplier lot and expiry.</p>
          <dl><dt>Device</dt><dd>Handheld scanner</dd><dt>Replaces</dt><dd>The receiving register</dd></dl>
        </article>
        <article class="h3-item">
          <span class="h3-st">02 · Mix compound</span>
          <h3><span class="ln"><span>Every batch</span></span><span class="ln"><span>knows its lots.</span></span></h3>
          <p>Each compound batch is linked to the lots inside it. Expired material is blocked before it reaches the mill.</p>
          <dl><dt>Device</dt><dd>Scanner and batch tag printer</dd><dt>Replaces</dt><dd>The batch sheet</dd></dl>
        </article>
        <article class="h3-item">
          <span class="h3-st">03 · Prepare steel band</span>
          <h3><span class="ln"><span>The tyre is born</span></span><span class="ln"><span>on the band.</span></span></h3>
          <p>A heat-resistant ID goes on the steel band, so the record starts before any rubber does. Band batch and preparation time are logged.</p>
          <dl><dt>Device</dt><dd>Label printer</dd><dt>Replaces</dt><dd>Hand marking</dd></dl>
        </article>
        <article class="h3-item">
          <span class="h3-st">04 · Build layers</span>
          <h3><span class="ln"><span>Built and traced,</span></span><span class="ln"><span>layer by layer.</span></span></h3>
          <p>Base, cushion and tread are each linked to their compound batch. A fixed scanner reads the tyre as the band is mounted.</p>
          <dl><dt>Device</dt><dd>Fixed scanner at the build machine</dd><dt>Replaces</dt><dd>The production sheet</dd></dl>
        </article>
        <article class="h3-item">
          <span class="h3-st">05 · Cure</span>
          <h3><span class="ln"><span>The press</span></span><span class="ln"><span>logs itself.</span></span></h3>
          <p>A clip-on logger records press temperature and open and close times for every cycle, linked to the tyre and its mould.</p>
          <dl><dt>Device</dt><dd>Press logger, read-only</dd><dt>Replaces</dt><dd>The press logbook</dd></dl>
        </article>
        <article class="h3-item">
          <span class="h3-st">06 · Check quality</span>
          <h3><span class="ln"><span>Checked</span></span><span class="ln"><span>and signed.</span></span></h3>
          <p>Ultrasound, weight, hardness and dimensions are saved against the tyre, each shown against its spec. The inspector signs off.</p>
          <dl><dt>Device</dt><dd>Tablet and the plant's instruments</dd><dt>Replaces</dt><dd>The check sheet</dd></dl>
        </article>
        <article class="h3-item">
          <span class="h3-st">07 · Store</span>
          <h3><span class="ln"><span>Found in seconds,</span></span><span class="ln"><span>held in one tap.</span></span></h3>
          <p>A scan at the rack records where every tyre sits, so any tyre can be located and held without a search.</p>
          <dl><dt>Device</dt><dd>Handheld scanner</dd><dt>Replaces</dt><dd>The stock sheet</dd></dl>
        </article>
        <article class="h3-item">
          <span class="h3-st">08 · Ship</span>
          <h3><span class="ln"><span>Shipped,</span></span><span class="ln"><span>never forgotten.</span></span></h3>
          <p>Pallet, container, export order and customer are linked. When a claim arrives months later, the full history is one scan away.</p>
          <dl><dt>Device</dt><dd>Handheld scanner</dd><dt>Replaces</dt><dd>The handwritten delivery note</dd></dl>
        </article>
      </div>
      <aside class="h3-pass" aria-label="Tyre passport, sample record">
        <div class="h3-pass-head"><div><small>Tyre passport</small><b>P1-2611-00427</b></div><span class="h3-count">1 / 8</span></div>
        <ol><li><span>Materials</span><em data-v="3 lots · in date">—</em></li><li><span>Compound</span><em data-v="3 batches">—</em></li><li><span>Steel band</span><em data-v="S-0412 · ID applied">—</em></li><li><span>Build</span><em data-v="Line B1 · 09:42">—</em></li><li><span>Cure</span><em data-v="P-05 · M-02 · logged">—</em></li><li><span>Quality</span><em data-v="Pass · QA-03">—</em></li><li><span>Storage</span><em data-v="Rack C4 · pallet 118">—</em></li><li><span>Dispatch</span><em data-v="Order EX-2614">—</em></li></ol>
      </aside>
      <p class="h3-note">Live 3D concept · sample data</p>
    </div>
  </div>

  <div class="h3-close">
    <h2>Nothing written by hand.<br><span>Nothing lost on the way.</span></h2>
    <a class="h3-next" href="#features">See what it finds <i aria-hidden="true">&darr;</i></a>
  </div>
`;
