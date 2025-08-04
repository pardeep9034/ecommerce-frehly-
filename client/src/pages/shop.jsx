import React from 'react'
import { OfferBanner } from '../components/common/offerBanner'
import Filters from '../components/common/filters'

import { HotDeals } from '../components/common/hotDeals'


const shop = () => {
  return (
    <div>
      <OfferBanner/>
      <Filters/>
         <HotDeals/>
    </div>
  )
}

export default shop
