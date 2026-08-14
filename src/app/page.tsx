import { Hero } from "@/components/home/Hero";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { SareeEdit } from "@/components/home/SareeEdit";
import { BestSellers } from "@/components/home/BestSellers";
import { CustomBlouseFeature } from "@/components/home/CustomBlouseFeature";
import { Lookbook } from "@/components/home/Lookbook";
import { BrandStory } from "@/components/home/BrandStory";
import { Testimonials } from "@/components/home/Testimonials";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { ServicePerks } from "@/components/home/ServicePerks";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicePerks />
      <FeaturedCategories />
      <SareeEdit />
      <BestSellers />
      <CustomBlouseFeature />
      <Lookbook />
      <BrandStory />
      <Testimonials />
      <InstagramFeed />
    </>
  );
}
