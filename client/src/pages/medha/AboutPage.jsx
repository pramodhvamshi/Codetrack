import React, { useEffect } from 'react';
import { MedhaNavbar } from '../../components/medha/MedhaNavbar';
import { AboutMedha } from '../../components/medha/AboutMedha';
import { BeliefSection } from '../../components/medha/BeliefSection';
import { ImpactStats } from '../../components/medha/ImpactStats';
import { MedhaFooter } from '../../components/medha/MedhaFooter';
import '../../components/medha/medha.css';

export function AboutPage() {
  useEffect(() => {
    document.title = 'About Medha | Medha Charitable Trust';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mct-root">
      <MedhaNavbar />
      <main style={{ paddingTop: '2rem' }}>
        <AboutMedha />
        <BeliefSection />
        <ImpactStats />
      </main>
      <MedhaFooter />
    </div>
  );
}
