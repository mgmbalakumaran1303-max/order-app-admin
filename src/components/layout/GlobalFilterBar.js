import { Filter, RotateCcw } from 'lucide-react';
import { useGlobalFilters } from '../../context/FiltersContext';
import { ALL_CITIES, CHANNELS, REGIONS } from '../../utils/constants';
import { FilterSelect } from '../ui/FormControls';

export function GlobalFilterBar() {
  const { filters, setFilter, resetFilters, isDefault } = useGlobalFilters();
  const cities = filters.region === 'all' ? ALL_CITIES : REGIONS.find((r) => r.id === filters.region)?.cities ?? [];

  return (
    <div className="filterbar" role="region" aria-label="Global filters">
      <span className="filterbar__caption">
        <Filter size={14} aria-hidden="true" /> Filters
      </span>
      <FilterSelect label="Region" value={filters.region} onChange={(v) => setFilter('region', v)} allLabel="All regions" options={REGIONS.map((r) => ({ value: r.id, label: r.label }))} />
      <FilterSelect label="City" value={filters.city} onChange={(v) => setFilter('city', v)} allLabel="All cities" options={cities} />
      <FilterSelect label="Ordering channel" value={filters.channel} onChange={(v) => setFilter('channel', v)} allLabel="All channels" options={CHANNELS.map((c) => ({ value: c.id, label: c.label }))} />
      <button type="button" className="link-btn filterbar__reset" onClick={resetFilters} disabled={isDefault}>
        <RotateCcw size={13} aria-hidden="true" /> Reset filters
      </button>
    </div>
  );
}
