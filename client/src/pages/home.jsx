import React from 'react'
import HeroSection from '../components/heroSection'
import OfferdServices from '../components/common/offerdServices'
import { PopularCategories } from '../components/common/popularCate'
import { PopularProducts } from '../components/common/popularProducts'
import { OfferSection } from '../components/common/offerSection'

const home = () => {
  return (
    <div className=''>
      <HeroSection/>
      <OfferdServices/>
      <PopularCategories/>
      <PopularProducts/>
      <OfferSection/>

      {/* Add more components as needed */}
    </div>
  )
}

export default home

