import React from 'react'
import HeroSection from '../components/heroSection'
import OfferdServices from '../components/common/offerdServices'
import { PopularCategories } from '../components/common/popularCate'
import { PopularProducts } from '../components/common/popularProducts'
import { OfferSection } from '../components/common/offerSection'
import { HotDeals } from '../components/common/hotDeals'
import { OfferBanner } from '../components/common/offerBanner'
import { Testimonial } from '../components/common/testimonial'
import { Footer } from '../components/common/footer'


const home = () => {
  return (
    <div className=''>
      <HeroSection/>
      <OfferdServices/>
      <PopularCategories/>
      <PopularProducts/>
      <OfferSection/>
      <HotDeals/>
      <OfferBanner/>
      <Testimonial/>
      <Footer/>

      {/* Add more components as needed */}
    </div>
  )
}

export default home

