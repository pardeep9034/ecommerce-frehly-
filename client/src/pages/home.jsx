import React from 'react'
import HeroSection from '../components/heroSection'
import OfferdServices from '../components/common/offerdServices'
import { PopularCategories } from '../components/common/popularCate'
import { PopularProducts } from '../components/common/popularProducts'
import { OfferSection } from '../components/common/offerSection'
import { HotDeals } from '../components/common/hotDeals'
import { OfferBanner } from '../components/common/offerBanner'
import { Testimonial } from '../components/common/testimonial'
import { Newsletter } from '../components/common/newsletter'

const Home = () => {
  return (
    <div className='flex flex-col overflow-hidden'>
      <HeroSection/>
      <OfferdServices/>
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
