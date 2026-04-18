/**
 * Smart contract interactions for Based Smiles.
 * Handles reward claiming, gallery fetching, and smile-back reactions.
 */

import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

const CONTRACT_ABI = [
  // Write
  'function submitSmile(bytes calldata imageData, uint8 score) external returns (uint256 smileId)',
  'function smileBack(uint256 smileId) external',
  'function fundPool() external payable',
  // Read
  'function getSmile(uint256 id) external view returns (address wallet, uint8 score, uint256 timestamp, uint256 smilebacks, bytes memory imageData)',
  'function totalSmiles() external view returns (uint256)',
  'function getPoolBalance() external view returns (uint256)',
  // Events
  'event SmileSubmitted(uint256 indexed id, address indexed wallet, uint8 score, bytes32 txHash)',
  'event RewardPaid(address indexed wallet, uint256 amount)',
];

function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

function getSigner(walletAddress: string) {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No wallet');
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner(walletAddress);
}

/**
 * Submit a smile to the contract and claim the 0.001 USDC reward.
 * Returns the transaction hash.
 */
export async function claimReward(
  walletAddress: string,
  imageDataUrl: string,
  score: number
): Promise<string> {
  const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const imageBytes = ethers.hexlify(Buffer.from(base64, 'base64'));

  // Mock for dev
  if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_ORACLE === 'true') {
    await new Promise((r) => setTimeout(r, 1200));
    return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }

  const signer = await getSigner(walletAddress);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  const tx = await contract.submitSmile(imageBytes, score);
  const receipt = await tx.wait();
  return receipt.hash;
}

export interface SmileEntry {
  id: string;
  imageData: string;
  score: number;
  wallet: string;
  smilebacks: number;
  txHash: string;
  timestamp: number;
}

/**
 * Fetch the latest 12 winning smiles from the contract.
 */
export async function fetchGallery(): Promise<SmileEntry[]> {
  // Mock gallery for dev
  if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_ORACLE === 'true') {
    return mockGallery();
  }

  try {
    const provider = getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const total = Number(await contract.totalSmiles());
    const count = Math.min(total, 12);

    const entries: SmileEntry[] = [];
    for (let i = total; i > total - count; i--) {
      const [wallet, score, timestamp, smilebacks, imageData] = await contract.getSmile(i);
      entries.push({
        id: String(i),
        wallet,
        score: Number(score),
        timestamp: Number(timestamp) * 1000,
        smilebacks: Number(smilebacks),
        txHash: '',
        imageData: imageData
          ? `data:image/jpeg;base64,${Buffer.from(ethers.getBytes(imageData)).toString('base64')}`
          : '',
      });
    }
    return entries;
  } catch (err) {
    console.error('fetchGallery error:', err);
    return mockGallery();
  }
}

/**
 * Record a smile-back reaction on-chain.
 */
export async function smileBack(smileId: string, walletAddress: string): Promise<void> {
  if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_ORACLE === 'true') {
    await new Promise((r) => setTimeout(r, 600));
    return;
  }
  const signer = await getSigner(walletAddress);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const tx = await contract.smileBack(BigInt(smileId));
  await tx.wait();
}

/** Mock gallery data for local development */
function mockGallery(): SmileEntry[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: String(i + 1),
    imageData: '',
    score: [5, 4, 4, 5, 4, 3][i],
    wallet: `0x${(i + 1).toString(16).padStart(40, '0')}`,
    smilebacks: [5, 3, 2, 1, 4, 0][i],
    txHash: `0x${'ab'.repeat(32)}`,
    timestamp: Date.now() - i * 3600000,
  }));
}
