'use client';

import { usePrivy } from '@privy-io/react-auth';
import CameraCapture from '@/components/CameraCapture';
import SmileGallery from '@/components/SmileGallery';
import StatsBar from '@/components/StatsBar';
import WalletButton from '@/components/WalletButton';

export default function Home() {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-teal-400 text-sm tracking-widest animate-pulse">LOADING...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50 bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">Based Smiles</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">Base Network</span>
        </div>
        <WalletButton />
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {authenticated ? (
          <>
            <StatsBar />
            <CameraCapture />
            <SmileGallery />
          </>
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl mb-4">😊</div>
            <h2 className="text-xl font-semibold">Smile to earn USDC</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Connect your wallet, capture a genuine smile, and earn 0.001 USDC — verified on-chain by Openputer AI Oracle.
            </p>
            <WalletButton />
          </div>
        )}
      </div>
    </main>
  );
}
