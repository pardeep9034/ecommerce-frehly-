import React from 'react'
import HeroSection from '@/components/freshly/HeroSection'
import OfferedServices from '@/components/freshly/OfferedServices'
import { PopularCategories } from '@/components/freshly/PopularCategories'
import { PopularProducts } from '@/components/freshly/PopularProducts'
import { OfferSection } from '@/components/freshly/OfferSection'
import { HotDeals } from '@/components/freshly/HotDeals'
import { OfferBanner } from '@/components/freshly/OfferBanner'
import { Testimonial } from '@/components/freshly/Testimonial'
import { Newsletter } from '@/components/freshly/Newsletter'

const Home = () => {
  return (
    <div className='flex flex-col overflow-hidden'>
      <HeroSection/>
      <OfferedServices/>
      <PopularCategories/>
      <PopularProducts/>
      <OfferSection/>
      <HotDeals/>
      <OfferBanner/>
      <Testimonial/>
      <Newsletter />
    </div>
  )
}

export default Home;
