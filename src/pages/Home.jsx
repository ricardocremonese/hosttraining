import React from 'react';
import HeroSection from '../components/home/HeroSection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import EditorialSection from '../components/home/EditorialSection';
import CategoryTiles from '../components/home/CategoryTiles';

export default function Home() {
  return (
    <div className="-mt-[100px] pt-0">
      <div className="pt-[100px]">
        <HeroSection />
      </div>
      <FeaturedProducts />
      <EditorialSection />
      <CategoryTiles />
    </div>
  );
}