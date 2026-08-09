import React, { useEffect } from 'react';
import { MedhaNavbar } from '../../components/medha/MedhaNavbar';
import { MedhaHero } from '../../components/medha/MedhaHero';
import { ImpactStats } from '../../components/medha/ImpactStats';
import { AboutMedha } from '../../components/medha/AboutMedha';
import { BeliefSection } from '../../components/medha/BeliefSection';
import { ProgrammeGrid } from '../../components/medha/ProgrammeGrid';
import { MedhaFooter } from '../../components/medha/MedhaFooter';
import '../../components/medha/medha.css';

export function MedhaHomePage() {
  useEffect(() => {
    document.title = 'Medha Charitable Trust | Empowering India Through Education';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mct-root">
      <MedhaNavbar />
      <main>
        <MedhaHero />
        <ImpactStats />
        <AboutMedha />
        <BeliefSection />
        <ProgrammeGrid />
      </main>
      <MedhaFooter />
    </div>
  );
}
