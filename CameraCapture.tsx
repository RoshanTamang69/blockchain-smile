'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { analyzeSmile } from '@/lib/oracle';
import { claimReward } from '@/lib/contract';
import { compressImage } from '@/lib/imageUtils';

type Phase = 'idle' | 'analyzing' | 'success' | 'fail' | 'claiming' | 'claimed';

interface SmileResult {
  score: number;
  txHash?: string;
  imageData?: string;
}

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [nounsFilter, setNounsFilter] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<SmileResult | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const { user } = usePrivy();

  // Start camera
  useEffect(() => {
    let stream: MediaStream;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 800, height: 600 } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          setStreaming(true);
        }
      })
      .catch(console.error);

    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !user?.wallet?.address) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d')!;
    // Mirror the selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const raw = canvas.toDataURL('image/jpeg', 0.85);
    const compressed = await compressImage(raw, 800, 600);

    setPhase('analyzing');
    setResult(null);

    try {
      const score = await analyzeSmile(compressed);
      setResult({ score, imageData: compressed });

      if (score > 3) {
        setPhase('success');
        // Auto-claim after short delay
        setTimeout(async () => {
          setPhase('claiming');
          try {
            const txHash = await claimReward(user.wallet!.address, compressed, score);
            setResult((r) => ({ ...r!, txHash }));
            setPhase('claimed');
            setCooldown(60);
          } catch {
            setPhase('success'); // stay on success even if tx fails
          }
        }, 800);
      } else {
        setPhase('fail');
        setTimeout(() => setPhase('idle'), 3000);
      }
    } catch {
      setPhase('idle');
    }
  }, [user]);

  const resetToIdle = () => {
    setPhase('idle');
    setResult(null);
  };

  return (
    <div className="space-y-3">
      {/* Camera */}
      <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 aspect-[4/3]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Corner guides */}
        {['top-3 left-3 border-t-2 border-l-2', 'top-3 right-3 border-t-2 border-r-2',
          'bottom-3 left-3 border-b-2 border-l-2', 'bottom-3 right-3 border-b-2 border-r-2'].map((cls, i) => (
          <div key={i} className={`absolute w-5 h-5 border-teal-400/60 ${cls} rounded-sm`} />
        ))}

        {/* Scan line when analyzing */}
        {phase === 'analyzing' && (
          <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent scan-line" />
        )}

        {/* Nouns overlay */}
        {nounsFilter && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-8xl opacity-80">🤓</div>
          </div>
        )}

        {/* Status overlay */}
        {phase !== 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <StatusOverlay phase={phase} score={result?.score} txHash={result?.txHash} onReset={resetToIdle} />
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => setNounsFilter((v) => !v)}
            className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
              nounsFilter
                ? 'bg-blue-500/30 text-blue-300 border-blue-500/40'
                : 'bg-black/40 text-white/50 border-white/20'
            }`}
          >
            Nouns
          </button>
        </div>

        <div className="absolute bottom-3 left-3 text-[10px] text-white/40 bg-black/40 px-2 py-1 rounded-full">
          Selfie mode
        </div>

        {!streaming && (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
            Camera starting…
          </div>
        )}
      </div>

      {/* Oracle panel */}
      {(phase === 'analyzing' || result) && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${phase === 'analyzing' ? 'bg-teal-400 animate-pulse' : 'bg-teal-400'}`} />
            <span className="text-[11px] text-white/50 tracking-wider uppercase">
              {phase === 'analyzing' ? 'Openputer AI Oracle — analyzing…' : 'Oracle result'}
            </span>
          </div>
          {result && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full transition-all duration-700"
                    style={{ width: `${(result.score / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-teal-400">{result.score}/5</span>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full ${s <= result.score ? 'bg-teal-400' : 'bg-white/10'}`}
                  />
                ))}
              </div>
              <p className="text-[11px] mt-2 text-white/50">
                {result.score > 3 ? '✓ Genuine smile detected — reward unlocked' : '✗ Score too low — try again with a bigger smile!'}
              </p>
            </>
          )}
        </div>
      )}

      {/* Reward toast */}
      {phase === 'claimed' && result?.txHash && (
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-3 flex items-center gap-3 fade-in-up">
          <div className="w-8 h-8 rounded-full bg-teal-400 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
            +
          </div>
          <div>
            <div className="text-teal-400 font-semibold">+0.001 USDC</div>
            <div className="text-[11px] text-white/40 mt-0.5">
              Stored on-chain ·{' '}
              <a
                href={`https://basescan.org/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {result.txHash.slice(0, 10)}…
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Capture button */}
      <div className="flex gap-2">
        <button
          onClick={capture}
          disabled={!streaming || phase === 'analyzing' || phase === 'claiming' || cooldown > 0}
          className="flex-1 bg-teal-500 text-black font-bold py-3 rounded-xl text-sm tracking-wide hover:bg-teal-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Wait ${cooldown}s` : phase === 'analyzing' ? 'Analyzing…' : 'Capture smile'}
        </button>
        <FundPoolButton />
      </div>
    </div>
  );
}

function StatusOverlay({
  phase, score, txHash, onReset,
}: {
  phase: Phase; score?: number; txHash?: string; onReset: () => void;
}) {
  if (phase === 'analyzing') {
    return (
      <div className="text-center space-y-2">
        <div className="text-3xl animate-bounce">🤖</div>
        <div className="text-xs text-teal-400 tracking-widest">ANALYZING…</div>
      </div>
    );
  }
  if (phase === 'claiming') {
    return (
      <div className="text-center space-y-2">
        <div className="text-3xl">⛓️</div>
        <div className="text-xs text-blue-400 tracking-widest">CLAIMING REWARD…</div>
      </div>
    );
  }
  if (phase === 'claimed') {
    return (
      <div className="text-center space-y-2" onClick={onReset}>
        <div className="text-3xl">🎉</div>
        <div className="text-xs text-teal-400 tracking-widest">+0.001 USDC EARNED</div>
        <div className="text-[10px] text-white/40">tap to dismiss</div>
      </div>
    );
  }
  if (phase === 'fail') {
    return (
      <div className="text-center space-y-2">
        <div className="text-3xl">😐</div>
        <div className="text-xs text-red-400 tracking-widest">SCORE: {score}/5 — TRY AGAIN</div>
      </div>
    );
  }
  return null;
}

function FundPoolButton() {
  const [loading, setLoading] = useState(false);

  const handleFund = async () => {
    setLoading(true);
    // TODO: connect to contract fundPool()
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
  };

  return (
    <button
      onClick={handleFund}
      disabled={loading}
      className="bg-white/5 border border-white/10 text-white/60 text-xs px-4 py-3 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-40"
    >
      {loading ? '…' : 'Fund pool'}
    </button>
  );
}
