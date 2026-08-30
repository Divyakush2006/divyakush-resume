import React from 'react';

import { HeroSection } from '../HeroSection';
import { StatementTicker } from '../components/StatementTicker';
import { SelectedWorks } from '../components/SelectedWorks';
import { ExperienceRoles } from '../components/ExperienceRoles';
import { CapabilityWall } from '../components/CapabilityWall';
import { EducationTimeline } from '../components/EducationTimeline';
import { CertificationsWall } from '../components/CertificationsWall';
import { InsightsCarousel } from '../components/InsightsCarousel';
import { FrequentQuestions } from '../components/FrequentQuestions';
import { ContactTakeover } from '../components/ContactTakeover';

/* ─────────────────────────────────────────────────────────────────
   Section order.

   Ten sections. The "discover / build / harden" process diagram and
   the About block are both gone — the first said nothing a reviewer
   would not assume of any engineer, and the second restated in cards
   what the statement, the experience section and the project pages
   already carry.

   The Recognition deck — a fanned stack of four competition cards —
   went for a related reason: by the time a reader reaches it, every
   result on it has already been made in a stronger form. The rank, the
   shortlists and the placings are stated on the project pages that
   produced them and again in the insights carousel directly above,
   with photographs and the account of what actually happened. A deck
   of badges after that is the same claims a third time, stripped of
   their evidence. The page now runs from the last moment on the
   timeline straight into the contact takeover.

   Credentials used to be one three-card grid holding a degree, a
   second degree and a certificate — three different kinds of claim sharing a
   template, so none read as what it was. It is now two sections: a
   chronology for education, an archive for certifications.

   The questions come last, immediately before the contact takeover,
   and they are the one section written for a specific reader: somebody
   who searched the name and wants to know within one screen whether
   this is the right person. By that point every answer in it has
   already been made further up with its evidence attached, so it reads
   as a recapitulation rather than as an introduction. It is also the
   visible half of the FAQPage structured data — see src/lib/faq.ts for
   why the two ship together or not at all.

   Evidence leads: one line of positioning after the hero, then the
   work. Surfaces alternate so the page reads as chapters rather than
   stripes.
   ───────────────────────────────────────────────────────────────── */
export function Home() {
  return (
    <main id="main">
      {/* bone  */} <HeroSection />
      {/* ink   */} <StatementTicker />
      {/* bone  */} <SelectedWorks />
      {/* bone- */} <ExperienceRoles />
      {/* ink   */} <CapabilityWall />
      {/* bone  */} <EducationTimeline />
      {/* bone- */} <CertificationsWall />
      {/* bone  */} <InsightsCarousel />
      {/* bone  */} <FrequentQuestions />
      {/* ink   */} <ContactTakeover />
    </main>
  );
}

export default Home;
