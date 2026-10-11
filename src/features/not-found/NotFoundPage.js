import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { usePageCrumb } from '../../context/BreadcrumbContext';

export default function NotFoundPage() {
  usePageCrumb('Not found');
  return (
    <div className="page">
      <div className="state">
        <span className="state__icon" aria-hidden="true">
          <Compass size={22} />
        </span>
        <h1 className="state__title">Page not found</h1>
        <p className="state__text">The page you are looking for does not exist or has moved.</p>
        <div className="state__action">
          <Link to="/command-center" className="btn btn--primary btn--md">
            Go to Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
