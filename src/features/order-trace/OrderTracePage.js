import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Check, Circle, Clock3, Search, X } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { ErrorState, LoadingState, NoDataState } from '../../components/feedback/States';
import { MaskedValue } from '../../components/dialogs/RevealPersonalDataDialog';
import { useAsync } from '../../hooks/useAsync';
import { orderService } from '../../services';
import { channelLabel, ORDER_FAILURE_STATUSES, ORDER_LIFECYCLE } from '../../utils/constants';
import { formatCurrency, formatDateTime, formatTime, formatTimestamp } from '../../utils/format';

/**
 * Derives timeline steps from the recorded events. Steps after a failure are
 * shown as "not reached" – a failed order is never drawn as delivered.
 */
export function buildTimeline(events) {
  const byType = Object.fromEntries(events.map((e) => [e.type, e]));
  const failure = events.find((e) => ORDER_FAILURE_STATUSES.includes(e.type));
  const delayed = events.find((e) => e.type === 'Delayed');
  const reached = ORDER_LIFECYCLE.filter((s) => byType[s]);
  const lastReached = reached[reached.length - 1];
  const steps = ORDER_LIFECYCLE.map((step) => {
    if (byType[step]) {
      return { step, state: 'done', event: byType[step], delayed: delayed && step === lastReached };
    }
    return { step, state: failure ? 'skipped' : 'pending' };
  });
  if (failure) {
    const idx = steps.findIndex((s) => s.state !== 'done');
    steps.splice(idx === -1 ? steps.length : idx, 0, { step: failure.type, state: 'failed', event: failure });
  } else {
    const next = steps.find((s) => s.state === 'pending');
    if (next) next.state = 'current';
  }
  return steps;
}

const STEP_ICON = { done: Check, failed: X, current: Clock3, pending: Circle, skipped: Circle };
const STEP_TEXT = { done: 'Completed', failed: 'Order stopped', current: 'In progress', pending: 'Not yet', skipped: 'Not reached' };

function Timeline({ events }) {
  const steps = buildTimeline(events);
  return (
    <ol className="lifecycle" aria-label="Order lifecycle">
      {steps.map((s) => {
        const Icon = STEP_ICON[s.state];
        return (
          <li key={s.step} className={`lifecycle__step is-${s.state} ${s.delayed ? 'is-delayed' : ''}`} data-testid={`step-${s.step}`} data-state={s.state}>
            <span className="lifecycle__marker" aria-hidden="true">
              <Icon size={14} />
            </span>
            <b>{s.step}</b>
            <span className="lifecycle__state">
              {STEP_TEXT[s.state]}
              {s.delayed && ' · delayed'}
            </span>
            {s.event && <time dateTime={s.event.at}>{formatTime(s.event.at)}</time>}
          </li>
        );
      })}
    </ol>
  );
}

const eventColumns = [
  { key: 'at', header: 'Timestamp', render: (e) => <time dateTime={e.at}>{formatTimestamp(e.at)}</time> },
  { key: 'type', header: 'Event', render: (e) => <StatusBadge status={e.type} /> },
  { key: 'description', header: 'Description' },
  { key: 'source', header: 'Source' },
];

export default function OrderTracePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [input, setInput] = useState(q);
  const [inputError, setInputError] = useState(null);
  useEffect(() => setInput(q), [q]);

  const trace = useAsync(() => orderService.traceOrder(q), [q], { enabled: Boolean(q) });
  const samples = useAsync(() => orderService.sampleOrderIds(), []);

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim()) {
      setInputError('Enter an order ID or provider reference.');
      return;
    }
    setInputError(null);
    setParams({ q: input.trim() });
  };

  const order = q ? trace.data : undefined;

  return (
    <PageContainer>
      <PageHeader title="Order Trace Explorer" description="Follow a single order step by step across channels, the order engine and the restaurant." />
      <Panel>
        <form className="trace-search" onSubmit={submit} role="search" noValidate>
          <label htmlFor="trace-input" className="sr-only">
            Order ID or provider reference
          </label>
          <div className={`search-field search-field--lg ${inputError ? 'has-error' : ''}`}>
            <Search size={16} aria-hidden="true" />
            <input
              id="trace-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Internal order ID (ORD-50001) or provider reference (WOLT-1A2B3)"
              aria-invalid={Boolean(inputError) || undefined}
              aria-describedby={inputError ? 'trace-input-error' : undefined}
            />
          </div>
          <Button type="submit" variant="primary">
            Trace order
          </Button>
        </form>
        {inputError && (
          <p className="field__error" id="trace-input-error" role="alert">
            {inputError}
          </p>
        )}
        {samples.data?.length > 0 && (
          <p className="quick-searches">
            Try:
            {samples.data.map((id) => (
              <button key={id} type="button" className="link-btn" onClick={() => setParams({ q: id })}>
                {id}
              </button>
            ))}
          </p>
        )}
      </Panel>

      {!q && <NoDataState icon={Search} title="Search for an order">Enter an order ID or a provider reference to see its full lifecycle.</NoDataState>}
      {q && trace.loading && <LoadingState variant="detail" rows={4} label="Loading order trace" />}
      {q && !trace.loading && trace.error && <ErrorState error={trace.error} onRetry={trace.reload} />}
      {order && !trace.loading && !trace.error && (
        <>
          <div className="order-summary">
            <div>
              <h2>
                {order.id} <StatusBadge status={order.status} />
              </h2>
              <p>
                <Link to={`/restaurants/${order.restaurant.id}`}>{order.restaurant.name}</Link>
                <span aria-hidden="true">·</span> {channelLabel(order.channel)}
                <span aria-hidden="true">·</span> <span className="mono">{order.providerRef}</span>
                <span aria-hidden="true">·</span> {formatCurrency(order.total)}
                <span aria-hidden="true">·</span> {formatDateTime(order.createdAt)}
              </p>
            </div>
            {order.relatedIssueId && (
              <Link to={`/issues/${order.relatedIssueId}`} className="btn btn--secondary btn--md">
                <AlertTriangle size={15} aria-hidden="true" /> Related issue {order.relatedIssueId}
              </Link>
            )}
          </div>
          <Panel title="Lifecycle">
            <Timeline events={order.events} />
          </Panel>
          <div className="grid grid--2-1">
            <Panel title="Event log" description="Chronological">
              <DataTable caption="Order events" columns={eventColumns} rows={order.events} rowKey={(e) => `${e.at}-${e.type}`} pageSize={20} itemLabel="events" />
            </Panel>
            <Panel title="Customer" description="Personal data is masked by default">
              <dl className="kv">
                <div className="kv__row">
                  <dt>Name</dt>
                  <dd>
                    <MaskedValue masked={order.customer.name} fieldLabel="customer name" resourceLabel={order.id} request={{ resourceType: 'order', resourceId: order.id, field: 'name' }} />
                  </dd>
                </div>
                <div className="kv__row">
                  <dt>Phone</dt>
                  <dd>
                    <MaskedValue masked={order.customer.phone} fieldLabel="customer phone number" resourceLabel={order.id} request={{ resourceType: 'order', resourceId: order.id, field: 'phone' }} />
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>
        </>
      )}
    </PageContainer>
  );
}
