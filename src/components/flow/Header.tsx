import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="app-header">
      <div
        className="brand cursor-pointer"
        onClick={() => nav('/')}
        aria-label="Home"
      >
        <span className="logo">Bl</span>
        <span className="brand-name">Black Hat</span>
      </div>

      <div className="header-actions">
        <input
          className="search"
          placeholder={t('header.searchPlaceholder')}
          aria-label={t('header.searchPlaceholder')}
        />
        <button
          className="btn btn-primary"
          onClick={() => nav('/Board')}
          title={t('header.new')}
          aria-label={t('header.new')}
        >
          {t('header.new')}
        </button>
      </div>
    </header>
  );
};

export default Header;
