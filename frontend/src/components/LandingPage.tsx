import { useTranslation } from 'react-i18next';
import { Cloud, Lock, Trash2, Zap, Shield, Globe, Gift } from 'lucide-react';
import { AuthForm } from './AuthForm';
import type { User } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onBuyCoffee: () => void;
  showCoffeePayment?: boolean;
  inlineAuth?: { apiUrl: string; onAuthSuccess: (token: string, user: User) => void };
}

export function LandingPage({ onGetStarted, onBuyCoffee, showCoffeePayment, inlineAuth }: LandingPageProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full animate-slide-up">
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-8">
        {/* Hero Section */}
        <section className="text-center relative overflow-hidden rounded-3xl min-h-[520px] flex items-center justify-center">
          <div className="relative z-10">
            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight text-[var(--color-portal-navy-themed)] max-w-3xl mx-auto tracking-tight">
              {t('landing.hero.title')}
            </h1>
            <p className="mt-6 text-base md:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-portal-orange to-yellow-500 text-portal-navy font-display font-bold text-sm px-8 py-3.5 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              {t('landing.hero.ctaStart')}
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </button>
            {showCoffeePayment && (
            <button
              onClick={onBuyCoffee}
              className="group bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display font-bold text-sm px-8 py-3.5 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              {t('landing.hero.ctaCoffee')}
            </button>
            )}
          </div>

          {/* Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] text-[var(--color-text-secondary)]">
              <span>🇩🇪</span> {t('landing.hero.madeIn')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] text-[var(--color-text-secondary)]">
              <Lock className="w-3 h-3" /> {t('landing.hero.secure')}
            </span>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-28">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-center text-[var(--color-portal-navy-themed)] mb-12">
            {t('landing.how.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-3xl p-8 shadow-portal hover:shadow-portal-hover border border-[var(--color-glass-border)] transition-all duration-500 text-center">
              <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-portal-orange to-yellow-500 text-portal-navy shadow-sm">
                <Cloud className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--color-portal-navy-themed)] mb-2">
                {t('landing.how.step1.title')}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {t('landing.how.step1.desc')}
              </p>
            </div>
            <div className="glass-panel rounded-3xl p-8 shadow-portal hover:shadow-portal-hover border border-[var(--color-glass-border)] transition-all duration-500 text-center">
              <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-portal-orange to-yellow-500 text-portal-navy shadow-sm">
                <Lock className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--color-portal-navy-themed)] mb-2">
                {t('landing.how.step2.title')}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {t('landing.how.step2.desc')}
              </p>
            </div>
            <div className="glass-panel rounded-3xl p-8 shadow-portal hover:shadow-portal-hover border border-[var(--color-glass-border)] transition-all duration-500 text-center">
              <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-portal-orange to-yellow-500 text-portal-navy shadow-sm">
                <Trash2 className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--color-portal-navy-themed)] mb-2">
                {t('landing.how.step3.title')}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {t('landing.how.step3.desc')}
              </p>
            </div>
          </div>
        </section>

        {/* Why Clumoove */}
        <section className="mt-28">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-center text-[var(--color-portal-navy-themed)] mb-12">
            {t('landing.why.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass-panel rounded-3xl p-6 shadow-portal hover:shadow-portal-hover border border-[var(--color-glass-border)] transition-all duration-500">
              <div className="w-10 h-10 mb-4 flex items-center justify-center rounded-xl bg-gradient-to-tr from-portal-orange/20 to-yellow-500/20 text-portal-orange">
                <Gift className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-display font-bold text-sm text-[var(--color-portal-navy-themed)] mb-1.5">
                {t('landing.why.feature1.title')}
              </h3>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                {t('landing.why.feature1.desc')}
              </p>
            </div>
            <div className="glass-panel rounded-3xl p-6 shadow-portal hover:shadow-portal-hover border border-[var(--color-glass-border)] transition-all duration-500">
              <div className="w-10 h-10 mb-4 flex items-center justify-center rounded-xl bg-gradient-to-tr from-portal-orange/20 to-yellow-500/20 text-portal-orange">
                <Globe className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-display font-bold text-sm text-[var(--color-portal-navy-themed)] mb-1.5">
                {t('landing.why.feature2.title')}
              </h3>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                {t('landing.why.feature2.desc')}
              </p>
            </div>
            <div className="glass-panel rounded-3xl p-6 shadow-portal hover:shadow-portal-hover border border-[var(--color-glass-border)] transition-all duration-500">
              <div className="w-10 h-10 mb-4 flex items-center justify-center rounded-xl bg-gradient-to-tr from-portal-orange/20 to-yellow-500/20 text-portal-orange">
                <Shield className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-display font-bold text-sm text-[var(--color-portal-navy-themed)] mb-1.5">
                {t('landing.why.feature3.title')}
              </h3>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                {t('landing.why.feature3.desc')}
              </p>
            </div>
            <div className="glass-panel rounded-3xl p-6 shadow-portal hover:shadow-portal-hover border border-[var(--color-glass-border)] transition-all duration-500">
              <div className="w-10 h-10 mb-4 flex items-center justify-center rounded-xl bg-gradient-to-tr from-portal-orange/20 to-yellow-500/20 text-portal-orange">
                <Zap className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-display font-bold text-sm text-[var(--color-portal-navy-themed)] mb-1.5">
                {t('landing.why.feature4.title')}
              </h3>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                {t('landing.why.feature4.desc')}
              </p>
            </div>
          </div>
        </section>
      </div>

      {showCoffeePayment ? (
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(255,255,255,0.3),transparent_70%)]" />
        <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-20 text-center">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white mb-4">
            {t('landing.coffee.title')}
          </h2>
          <p className="text-white/85 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            {t('landing.coffee.desc')}
          </p>
          <button
            onClick={onBuyCoffee}
            className="group inline-flex items-center gap-2 bg-white text-amber-700 font-display font-bold text-sm px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            €2 {t('coffee.buy')}
          </button>
        </div>
      </section>
      ) : inlineAuth && (
      <section className="max-w-md mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="font-display font-bold text-2xl text-[var(--color-portal-navy-themed)]">
            {t('landing.register.title')}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {t('landing.register.subtitle')}
          </p>
        </div>
        <AuthForm
          apiUrl={inlineAuth.apiUrl}
          onAuthSuccess={inlineAuth.onAuthSuccess}
          startInRegister={true}
        />
      </section>
      )}
    </div>
  );
}
