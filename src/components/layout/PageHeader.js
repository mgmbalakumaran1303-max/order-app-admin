import { FlaskConical } from 'lucide-react';
import { IS_MOCK } from '../../config/env';

export function PageHeader({ title, description, actions, eyebrow, children }) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>
          {title}
          {IS_MOCK && (
            <span className="sample-chip" title="This page shows sample data from the mock service layer.">
              <FlaskConical size={11} aria-hidden="true" /> Sample data
            </span>
          )}
        </h1>
        {description && <p>{description}</p>}
        {children}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}

export function PageContainer({ children }) {
  return <div className="page">{children}</div>;
}
