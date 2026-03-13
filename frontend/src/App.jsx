import { useState } from 'react'
import './App.css'
import HeroSection from '../components/hero'
import HowItWorks from '../components/works'
import WhyChooseUs from '../components/whychoose'
import BestInBusiness from '../components/best'
import Footer from '../components/footer'

function App() {
  return (
    <>
      <HeroSection />
      <HowItWorks/>
      <WhyChooseUs/>
      <BestInBusiness/>
      <Footer/>
    </>
  )
}

export default App
