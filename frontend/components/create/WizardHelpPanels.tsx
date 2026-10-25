"use client";

/** Long-form help copied from the Streamlit UI reference (expanders / help text). */

export function WizardHowToCreate() {
  return (
    <div className="mt-3 space-y-6 text-sm text-[var(--wm-text-muted)]">
      <section>
        <p className="mb-2 text-white/90">This process guides you through creating a portfolio in 5 steps:</p>
        <ol className="list-inside list-decimal space-y-2">
          <li>
            <strong className="text-white">Step 1: Portfolio Information</strong> — Name, description, currency, and
            initial investment.
          </li>
          <li>
            <strong className="text-white">Step 2: Choose Input Method</strong> — Select how you want to add assets:
            <ul className="ml-6 mt-1 list-disc space-y-1">
              <li>
                <strong className="text-white/90">Text Input</strong> — Fast entry using natural language formats.
              </li>
              <li>
                <strong className="text-white/90">Upload File</strong> — Import from CSV (export from Excel as CSV if
                needed).
              </li>
              <li>
                <strong className="text-white/90">Manual Entry</strong> — Add each asset via search with validation.
              </li>
              <li>
                <strong className="text-white/90">Use Template</strong> — Start with pre-built investment strategies.
              </li>
            </ul>
          </li>
          <li>
            <strong className="text-white">Step 3: Add Assets</strong> — Enter your portfolio assets based on selected
            method.
          </li>
          <li>
            <strong className="text-white">Step 4: Settings &amp; Review</strong> — Configure options and review your
            portfolio.
          </li>
          <li>
            <strong className="text-white">Step 5: Create</strong> — Finalize and create your portfolio.
          </li>
        </ol>
      </section>

      <section>
        <h3 className="mb-2 font-medium text-white">Supported Text Input Formats</h3>
        <div className="space-y-1.5 rounded-lg bg-black/50 p-3 font-mono text-xs leading-relaxed">
          <div>
            <span className="text-cyan-300">AAPL:40%, MSFT:30%, GOOGL:30%</span>{" "}
            <span className="text-white/40"># Colon with percentages</span>
          </div>
          <div>
            <span className="text-cyan-300">AAPL 0.4, MSFT 0.3, GOOGL 0.3</span>{" "}
            <span className="text-white/40"># Space with decimals</span>
          </div>
          <div>
            <span className="text-cyan-300">AAPL 40, MSFT 30, GOOGL 30</span>{" "}
            <span className="text-white/40"># Numbers &gt; 1 (auto %)</span>
          </div>
          <div>
            <span className="text-cyan-300">AAPL, MSFT, GOOGL</span>{" "}
            <span className="text-white/40"># Equal weights</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-medium text-white">Important Notes</h3>
        <ul className="list-inside list-disc space-y-1">
          <li>Weights are automatically normalized to sum to 100%</li>
          <li>Use standard ticker symbols (AAPL, MSFT, GOOGL, etc.)</li>
          <li>Company information and prices are fetched automatically when data is available</li>
          <li>All portfolios are validated before creation</li>
          <li>You can allocate cash as a percentage of your portfolio</li>
        </ul>
      </section>
    </div>
  );
}

export function WizardStep2WhichMethod() {
  return (
    <div className="mt-3 space-y-5 text-sm text-[var(--wm-text-muted)]">
      <section>
        <p className="mb-2 font-medium text-white">Text Input — Best for quick entry</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Fastest way to create a portfolio</li>
          <li>Supports multiple text formats</li>
          <li>Good for portfolios with 5–20 assets</li>
        </ul>
      </section>
      <section>
        <p className="mb-2 font-medium text-white">Upload File — Best for existing data</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Import from CSV spreadsheets (Excel: Save As CSV)</li>
          <li>Perfect if you already have a portfolio list</li>
          <li>Required column: ticker; optional weight, sector, etc.</li>
        </ul>
      </section>
      <section>
        <p className="mb-2 font-medium text-white">Manual Entry — Best for precision</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Search by company or ticker and add one position at a time</li>
          <li>Full control over each position</li>
          <li>Real-time search and validation via market data</li>
        </ul>
      </section>
      <section>
        <p className="mb-2 font-medium text-white">Use Template — Best for beginners</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Pre-built investment strategies</li>
          <li>Factor-style and classic mixes (e.g. value tilt, 60/40-style)</li>
          <li>Can be customized after creation in the portfolio list</li>
        </ul>
      </section>
    </div>
  );
}

export function WizardWhatAreTemplates() {
  return (
    <div className="mt-3 space-y-4 text-sm text-[var(--wm-text-muted)]">
      <p>
        <strong className="text-white">Portfolio Templates</strong> are pre-built investment strategies based on:
      </p>
      <section>
        <p className="mb-1 font-medium text-white">Factor-Based Strategies:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong className="text-white/90">Value Factor</strong> — Undervalued companies with low P/E ratios
          </li>
          <li>
            <strong className="text-white/90">Quality Factor</strong> — High ROE companies with low debt
          </li>
          <li>
            <strong className="text-white/90">Growth Factor</strong> — Fast-growing companies with high revenue growth
          </li>
          <li>
            <strong className="text-white/90">Low Volatility</strong> — Stocks with beta &lt; 0.8 for stability
          </li>
          <li>
            <strong className="text-white/90">Dividend Factor</strong> — High dividend yield stocks (3%+)
          </li>
        </ul>
      </section>
      <section>
        <p className="mb-1 font-medium text-white">Classic Strategies:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong className="text-white/90">60/40 Portfolio</strong> — Classic balanced allocation (60% stocks, 40%
            bonds)
          </li>
          <li>
            <strong className="text-white/90">All Weather Portfolio</strong> — Multi-asset diversification across
            conditions
          </li>
          <li>
            <strong className="text-white/90">Tech Focus</strong> — Technology sector concentration
          </li>
        </ul>
      </section>
      <section>
        <p className="mb-1 font-medium text-white">Customization:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>All templates can be customized after selection</li>
          <li>You can modify weights, add/remove assets after save</li>
          <li>Templates are starting points — make them your own!</li>
        </ul>
      </section>
    </div>
  );
}

export function WizardSettingsConfigure() {
  return (
    <div className="mt-3 space-y-5 text-sm text-[var(--wm-text-muted)]">
      <section>
        <p className="mb-2 font-medium text-white">Portfolio Options:</p>
        <ul className="space-y-2">
          <li>
            <strong className="text-white/90">Fetch company information</strong> — Automatically get company names,
            sectors, and market data
          </li>
          <li>
            <strong className="text-white/90">Auto-normalize weights</strong> — Automatically adjust weights to sum to
            100%
          </li>
          <li>
            <strong className="text-white/90">Update current prices</strong> — Fetch latest market prices for all assets
          </li>
          <li>
            <strong className="text-white/90">Calculate share quantities</strong> — Calculate number of shares based on
            initial investment
          </li>
        </ul>
      </section>
      <section>
        <p className="mb-2 font-medium text-white">Cash Management:</p>
        <ul className="space-y-2">
          <li>
            <strong className="text-white/90">Planned Cash Allocation</strong> — Percentage to intentionally keep in
            cash
          </li>
          <li>Useful for maintaining liquidity or waiting for better entry points</li>
          <li>Remaining percentage will be allocated to your assets</li>
          <li>Example: 10% cash means 90% goes to your selected assets</li>
        </ul>
      </section>
      <section>
        <p className="mb-2 font-medium text-white">Review:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Check all your portfolio details before creation</li>
          <li>Verify asset count and total weight</li>
          <li>Make sure everything looks correct</li>
        </ul>
      </section>
    </div>
  );
}

export function WizardManualEntryHelp() {
  return (
    <div className="mt-3 space-y-4 text-sm text-[var(--wm-text-muted)]">
      <section>
        <p className="mb-2 font-medium text-white">Manual Entry Process:</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>Search by company name or ticker (e.g. AAPL)</li>
          <li>Pick a result from the list</li>
          <li>Set weight as a percentage (e.g. 30 for 30%)</li>
          <li>Click &quot;Add asset&quot; to add to the portfolio</li>
          <li>Repeat for each asset</li>
        </ol>
      </section>
      <section>
        <p className="mb-2 font-medium text-white">Features:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Live search against market data</li>
          <li>Full control over each position</li>
          <li>Allocation chart updates as you add assets</li>
          <li>Normalize weights when you&apos;re ready</li>
          <li>Weights can be auto-normalized on save (Step 4)</li>
        </ul>
      </section>
      <section>
        <p className="mb-2 font-medium text-white">Best for:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Small portfolios (5–10 assets)</li>
          <li>When you want to pick each ticker individually</li>
          <li>Precise control over each position</li>
        </ul>
      </section>
    </div>
  );
}

export function WizardTextInputDeepHelp() {
  return (
    <div className="mt-2 space-y-3 text-xs text-[var(--wm-text-muted)]">
      <p className="font-medium text-white/90">Supported formats</p>
      <ul className="space-y-1 font-mono text-[11px]">
        <li>
          <span className="text-cyan-300">AAPL:40%, MSFT:30%, GOOGL:30%</span> — Colon with percentages
        </li>
        <li>
          <span className="text-cyan-300">AAPL 0.4, MSFT 0.3, GOOGL 0.3</span> — Space with decimals (0.0 to 1.0)
        </li>
        <li>
          <span className="text-cyan-300">AAPL 40, MSFT 30, GOOGL 30</span> — Numbers &gt; 1 (automatically treated as
          percentages)
        </li>
        <li>
          <span className="text-cyan-300">AAPL, MSFT, GOOGL</span> — Equal weights (each asset gets equal allocation)
        </li>
      </ul>
      <p className="font-medium text-white/90">Tips</p>
      <ul className="list-inside list-disc space-y-1">
        <li>Weights don&apos;t need to sum to 100% (auto-normalized)</li>
        <li>Use standard ticker symbols</li>
        <li>Invalid tickers are highlighted and excluded</li>
        <li>Formats can be mixed in the same input</li>
      </ul>
    </div>
  );
}

export function WizardCsvFormatHelp() {
  return (
    <div className="mt-3 space-y-4 text-sm text-[var(--wm-text-muted)]">
      <section>
        <p className="mb-2 font-medium text-white">File requirements:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            Supported formats: <strong className="text-white">CSV</strong> (export Excel to .csv). Excel .xlsx upload
            is not in this API yet.
          </li>
          <li>
            Required column: <code className="text-emerald-400">ticker</code> (or any column name you map mentally to
            ticker)
          </li>
          <li>
            Optional columns: <code className="text-emerald-400">weight</code>, <code className="text-emerald-400">name</code>,{" "}
            <code className="text-emerald-400">sector</code>
          </li>
        </ul>
      </section>
      <section>
        <p className="mb-2 font-medium text-white">Example CSV format:</p>
        <pre className="rounded-lg bg-black/50 p-3 font-mono text-xs text-white/90">{`ticker,weight
AAPL,30
MSFT,25
GOOGL,20`}</pre>
      </section>
      <section>
        <p className="mb-2 font-medium text-white">Example with equal weights:</p>
        <pre className="rounded-lg bg-black/50 p-3 font-mono text-xs text-white/90">{`ticker
AAPL
MSFT
GOOGL`}</pre>
        <p className="mt-1 text-xs">(Weights will be automatically set to equal)</p>
      </section>
      <section>
        <p className="mb-2 font-medium text-white">Column mapping:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Your file must include a column named ticker (lowercase) for this importer</li>
          <li>Optional weight column; otherwise equal weights apply</li>
          <li>Invalid tickers will be excluded when saving</li>
        </ul>
      </section>
    </div>
  );
}
