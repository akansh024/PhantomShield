import React, { useEffect, useState } from 'react';
import HeroSection from '../../components/hero';
import AdminLoginModal from '../components/ui/AdminLoginModal';
import PerformanceAudit from '../../components/best';
import Works from '../../components/works';
import Footer from '../../components/footer';

const Landing = () => {
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    // Force dark background on the body to prevent white flashes between sections
    document.body.style.backgroundColor = '#030a10';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="bg-[var(--color-primary-base)] min-h-screen text-white overflow-x-hidden selection:bg-[var(--color-accent-neon)]/30">
      <AdminLoginModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
      <HeroSection onAdminTrigger={() => setShowAdminModal(true)} />
      <Works />
      <PerformanceAudit />
      <Footer />
    </div>
  );
};

export default Landing;
