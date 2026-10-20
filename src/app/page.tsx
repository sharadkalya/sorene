import BrandPage from '@/frontend/components/BrandPage';

const HERO_VIDEO_KEY = 'videos/SV_2.mp4';

export default function Home() {
  const r2Base = process.env.R2_PUBLIC_URL?.replace(/\/+$/, '');
  const videoSrc = r2Base ? `${r2Base}/${HERO_VIDEO_KEY}` : '/assets/videos/SV_2.mp4';

  return <BrandPage videoSrc={videoSrc} />;
}
