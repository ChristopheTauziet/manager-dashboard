import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AssetsSection } from './AssetsPage'
import { CompensationSection } from './CompensationPage'
import { TaxesSection } from './TaxesPage'

export default function FinancePage() {
  const location = useLocation()

  useLayoutEffect(() => {
    const id = location.hash.replace(/^#/, '')
    if (!id) return
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.pathname, location.hash])

  const quickLinkClass =
    'rounded-full border border-primary/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary/10 transition-colors'

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assets, compensation, and taxes in one place.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 pt-1" aria-label="Jump to section">
          <a href="#compensation" className={quickLinkClass}>
            Compensation
          </a>
          <a href="#taxes" className={quickLinkClass}>
            Taxes
          </a>
        </nav>
      </div>

      <section id="assets" className="mt-8 scroll-mt-24 space-y-6">
        <h2 className="text-xl font-semibold border-b border-border pb-2">Assets</h2>
        <AssetsSection />
      </section>

      <section id="compensation" className="mt-24 scroll-mt-24 space-y-6">
        <h2 className="text-xl font-semibold border-b border-border pb-2">Compensation</h2>
        <CompensationSection />
      </section>

      <section id="taxes" className="mt-24 scroll-mt-24 space-y-6">
        <h2 className="text-xl font-semibold border-b border-border pb-2">Taxes</h2>
        <TaxesSection />
      </section>
    </div>
  )
}
