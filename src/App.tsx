import { useEffect } from 'react';
import { HomePage } from '@/pages/HomePage';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const init = useAppStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return <HomePage />;
}