import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, Store } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { KeyValueList } from '../../components/ui/Panel';
import { AsyncContent, LoadingState, StaleDataBanner } from '../../components/feedback/States';
import { Modal } from '../../components/dialogs/Modal';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { useMutation } from '../../hooks/useMutation';
import { integrationService } from '../../services';
import { IS_MOCK } from '../../config/env';
import { formatDateTime, formatRelative, isStale } from '../../utils/format';

function IntegrationDetail({ id, onClose, onChanged }) {
  const toast = useToast();
  const detail = useAsync(() => integrationService.getIntegration(id), [id]);
  const retry = useMutation(() => integrationService.retryConnection(id));

  const onRetry = async () => {
    try {
      await retry.mutate();
      toast.success('Connection retried successfully.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      detail.reload();
      onChanged();
    }
  };

  return (
    <Modal title={detail.data?.name ?? 'Integration'} eyebrow="Integration details" onClose={onClose} size="lg" busy={retry.pending}>
      <AsyncContent state={detail} loading={<LoadingState rows={4} />}>
        {(i) => (
          <div className="stack">
            <KeyValueList
              items={[
                ['Category', i.category],
                ['Status', <StatusBadge status={i.status} />],
                ['Last successful sync', `${formatRelative(i.lastSuccessAt)} (${formatDateTime(i.lastSuccessAt)})`],
                ['30-day uptime', `${i.uptime30d}%${IS_MOCK ? ' (sample value)' : ''}`],
                ['Connected restaurants', i.connectedRestaurantCount],
              ]}
            />
            <div>
              <h3 className="subhead">Recent errors</h3>
              {i.errors.length ? (
                <ul className="error-list">
                  {i.errors.map((e, idx) => (
                    <li key={idx}>
                      <time dateTime={e.at}>{formatRelative(e.at)}</time> {e.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No recent errors.</p>
              )}
            </div>
            <div>
              <h3 className="subhead">Affected restaurants</h3>
              {i.affectedRestaurants.length ? (
                <ul className="link-list">
                  {i.affectedRestaurants.map((r) => (
                    <li key={r.id}>
                      <Store size={15} aria-hidden="true" />
                      <Link to={`/restaurants/${r.id}/channels`} onClick={onClose}>
                        {r.name}
                      </Link>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No restaurants currently affected.</p>
              )}
            </div>
            <div>
              <h3 className="subhead">Related issues</h3>
              {i.relatedIssues.length ? (
                <ul className="link-list">
                  {i.relatedIssues.map((iss) => (
                    <li key={iss.id}>
                      <AlertCircle size={15} aria-hidden="true" />
                      <Link to={`/issues/${iss.id}`} onClick={onClose}>
                        {iss.id}
                      </Link>
                      <span className="muted">{iss.title}</span>
                      <StatusBadge status={iss.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No related issues.</p>
              )}
            </div>
            <div className="modal__footer">
              {i.supportsRetry ? (
                <Button icon={RefreshCw} onClick={onRetry} loading={retry.pending}>
                  Retry connection
                </Button>
              ) : (
                <span className="muted small">This provider does not support manual retries.</span>
              )}
              <Button variant="primary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </AsyncContent>
    </Modal>
  );
}

export default function IntegrationsPage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('provider');
  const integrations = useAsync(() => integrationService.listIntegrations(), []);

  return (
    <PageContainer>
      <PageHeader
        title="Integrations"
        description="Connectivity of delivery marketplaces, messaging, payments and maps providers."
        actions={
          <Button icon={RefreshCw} onClick={integrations.reload} loading={integrations.loading && integrations.data !== undefined}>
            Refresh
          </Button>
        }
      />
      <AsyncContent state={integrations} loading={<LoadingState variant="cards" rows={6} />}>
        {(list) => (
          <>
            <StaleDataBanner asOf={integrations.loadedAt} subject="Integration status" onRefresh={integrations.reload} />
            <div className="card-grid">
              {list.map((i) => (
                <article key={i.id} className={`integration-card is-${i.status.toLowerCase()}`}>
                  <div className="integration-card__top">
                    <span className="provider-logo" aria-hidden="true">
                      {i.name[0]}
                    </span>
                    <StatusBadge status={i.status} />
                  </div>
                  <h2>{i.name}</h2>
                  <p className="muted">{i.category}</p>
                  <dl className="integration-card__stats">
                    <div>
                      <dt>Last success</dt>
                      <dd className={isStale(i.lastSuccessAt) ? 'is-stale' : ''}>{formatRelative(i.lastSuccessAt)}</dd>
                    </div>
                    <div>
                      <dt>30-day uptime</dt>
                      <dd>
                        {i.uptime30d}%{IS_MOCK && <span className="muted"> *</span>}
                      </dd>
                    </div>
                    <div>
                      <dt>Recent errors</dt>
                      <dd>{i.errors.length}</dd>
                    </div>
                  </dl>
                  {i.errors[0] && <p className="integration-card__error">{i.errors[0].message}</p>}
                  <Button onClick={() => setParams({ provider: i.id })}>View details</Button>
                </article>
              ))}
            </div>
            {IS_MOCK && <p className="muted small footnote">* Uptime values are sample data, not production telemetry.</p>}
          </>
        )}
      </AsyncContent>
      {selected && <IntegrationDetail id={selected} onClose={() => setParams({})} onChanged={integrations.reload} />}
    </PageContainer>
  );
}
