import dynamic from 'next/dynamic';
import { ToastProvider } from '@/lib/toast';

const StudioApp = dynamic(() => import('@/components/StudioApp').then((m) => m.StudioApp), { ssr: false });

export default function Home(): JSX.Element {
  return (
    <ToastProvider>
      <StudioApp />
    </ToastProvider>
  );
}
