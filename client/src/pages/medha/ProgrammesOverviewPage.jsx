import React, { useEffect } from 'react';
import { MedhaNavbar } from '../../components/medha/MedhaNavbar';
import { ProgrammeGrid } from '../../components/medha/ProgrammeGrid';
import { MedhaFooter } from '../../components/medha/MedhaFooter';
import '../../components/medha/medha.css';

export function ProgrammesOverviewPage() {
  useEffect(() => {
    document.title = 'Programmes | Medha Charitable Trust';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="mct-root">
      <MedhaNavbar />
      <main style={{ paddingTop: '2rem' }}>
        <ProgrammeGrid />
      </main>
      <MedhaFooter />
    </div>
  );
}
