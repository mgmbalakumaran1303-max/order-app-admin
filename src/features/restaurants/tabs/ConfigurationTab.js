import { useState } from 'react';
import { Lock, Save } from 'lucide-react';
import { Panel, KeyValueList } from '../../../components/ui/Panel';
import { Button } from '../../../components/ui/Button';
import { Field } from '../../../components/ui/FormControls';
import { ConfirmActionDialog } from '../../../components/dialogs/ConfirmActionDialog';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { restaurantService } from '../../../services';
import { PERMISSIONS } from '../../../utils/constants';
import { formatDateTime } from '../../../utils/format';
import { useRestaurant } from '../Restaurant360Layout';

const FIELDS = [
  { key: 'prepTimeMinutes', label: 'Default preparation time (min)', min: 5, max: 90 },
  { key: 'maxOrdersPer15Min', label: 'Max. orders per 15 minutes', min: 1, max: 100 },
  { key: 'orderAcceptanceTimeoutSec', label: 'Auto-cancel unaccepted orders after (s)', min: 60, max: 600 },
  { key: 'menuSyncIntervalMinutes', label: 'Menu sync interval (min)', min: 5, max: 240 },
];

const describe = (key, value) => {
  if (key === 'autoAccept') return `Auto-accept orders: ${value ? 'On' : 'Off'}`;
  return `${FIELDS.find((f) => f.key === key).label}: ${value}`;
};

export default function ConfigurationTab() {
  const { restaurant, setRestaurant } = useRestaurant();
  const { can } = useAuth();
  const toast = useToast();
  const canEdit = can(PERMISSIONS.RESTAURANT_CONFIG_WRITE);
  const [draft, setDraft] = useState(restaurant.config);
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);

  const changes = Object.keys(draft).filter((k) => ['autoAccept', ...FIELDS.map((f) => f.key)].includes(k) && draft[k] !== restaurant.config[k]);

  const review = (e) => {
    e.preventDefault();
    const next = {};
    FIELDS.forEach((f) => {
      const v = draft[f.key];
      if (!Number.isFinite(v) || v < f.min || v > f.max) next[f.key] = `Enter a value between ${f.min} and ${f.max}.`;
    });
    setErrors(next);
    if (!Object.keys(next).length && changes.length) setConfirming(true);
  };

  return (
    <div className="grid grid--2-1">
      <Panel title="Operational settings" description={canEdit ? 'Changes apply to new orders immediately after confirmation.' : undefined}>
        {!canEdit && (
          <div className="banner banner--info">
            <Lock size={15} aria-hidden="true" /> Your role can view but not change restaurant configuration.
          </div>
        )}
        <form className="form" onSubmit={review} noValidate>
          <label className="switch">
            <input type="checkbox" checked={draft.autoAccept} disabled={!canEdit} onChange={(e) => setDraft((d) => ({ ...d, autoAccept: e.target.checked }))} />
            <span className="switch__track" aria-hidden="true" />
            <span>Auto-accept incoming orders</span>
          </label>
          <div className="form__row">
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label} error={errors[f.key]}>
                {(props) => (
                  <input
                    {...props}
                    type="number"
                    min={f.min}
                    max={f.max}
                    disabled={!canEdit}
                    value={Number.isFinite(draft[f.key]) ? draft[f.key] : ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value === '' ? NaN : Number(e.target.value) }))}
                  />
                )}
              </Field>
            ))}
          </div>
          {canEdit && (
            <div className="form__actions">
              <Button onClick={() => { setDraft(restaurant.config); setErrors({}); }} disabled={!changes.length}>
                Discard changes
              </Button>
              <Button type="submit" variant="primary" icon={Save} disabled={!changes.length}>
                Review & save
              </Button>
            </div>
          )}
        </form>
      </Panel>
      <Panel title="Details">
        <KeyValueList
          items={[
            ['Timezone', restaurant.timezone],
            ['Last modified by', restaurant.config.lastModifiedByName],
            ['Last modified', formatDateTime(restaurant.config.lastModifiedAt)],
          ]}
        />
      </Panel>
      {confirming && (
        <ConfirmActionDialog
          title="Save configuration changes"
          change={
            <ul className="plain-list">
              {changes.map((k) => (
                <li key={k}>{describe(k, draft[k])}</li>
              ))}
            </ul>
          }
          resource={`${restaurant.name} (${restaurant.id})`}
          impact="Affects how new orders are accepted and timed for this restaurant on all channels."
          undo="Change the values back on this tab. Previous values are recorded in the Audit tab."
          confirmLabel="Save changes"
          onClose={() => setConfirming(false)}
          onConfirm={async () => {
            const patch = Object.fromEntries(changes.map((k) => [k, draft[k]]));
            const config = await restaurantService.updateConfig(restaurant.id, patch);
            setRestaurant((r) => ({ ...r, config }));
            setDraft(config);
            toast.success('Configuration saved.');
          }}
        />
      )}
    </div>
  );
}
