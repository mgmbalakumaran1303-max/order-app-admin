import { channelLabel } from '../../utils/constants';
import { initials } from '../../utils/format';

export function RestaurantAvatar({ name, size = 'sm' }) {
  return (
    <span className={`restaurant-avatar restaurant-avatar--${size}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

const SHORT = { direct: 'D', lieferando: 'LF', wolt: 'W', uber_eats: 'UE', whatsapp: 'WA' };

export function ChannelChips({ channels }) {
  return (
    <span className="channel-chips" aria-label={channels.map(channelLabel).join(', ')}>
      {channels.map((c) => (
        <span key={c} className={`channel-chip channel-chip--${c}`} title={channelLabel(c)} aria-hidden="true">
          {SHORT[c]}
        </span>
      ))}
    </span>
  );
}
