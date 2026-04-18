/**
 * Openputer AI Oracle integration for smile analysis.
 * Sends compressed image to the oracle contract and returns a score 1-5.
 */

import { ethers } from 'ethers';

const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_ORACLE_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

// Minimal ABI for the Openputer oracle
const ORACLE_ABI = [
  'function requestAnalysis(bytes calldata imageData) external payable returns (bytes32 requestId)',
  'event AnalysisResult(bytes32 indexed requestId, uint8 score)',
];

/**
 * Analyze a smile image using the Openputer AI Oracle.
 * Returns a score from 1 (not smiling) to 5 (huge genuine smile).
 */
export async function analyzeSmile(imageDataUrl: string): Promise<number> {
  // Strip base64 header and convert to bytes
  const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const imageBytes = Buffer.from(base64, 'base64');

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);

    // Request analysis — in production this is a payable call
    // For demo/testnet, we simulate with a mock score
    if (process.env.NEXT_PUBLIC_MOCK_ORACLE === 'true') {
      return mockAnalysis();
    }

    const tx = await oracle.requestAnalysis(imageBytes, {
      value: ethers.parseEther('0.0001'), // oracle fee
    });

    const receipt = await tx.wait();
    const resultEvent = receipt.logs.find(
      (log: ethers.Log) => log.topics[0] === oracle.interface.getEvent('AnalysisResult')!.topicHash
    );

    if (!resultEvent) throw new Error('No oracle result in tx');
    const decoded = oracle.interface.decodeEventLog('AnalysisResult', resultEvent.data, resultEvent.topics);
    return Number(decoded.score);
  } catch (err) {
    console.error('Oracle error:', err);
    // Fallback to mock in dev
    if (process.env.NODE_ENV === 'development') return mockAnalysis();
    throw err;
  }
}

/** Mock oracle for local development */
function mockAnalysis(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Weighted random: more likely to score high (positive UX)
      const weights = [0.05, 0.10, 0.20, 0.35, 0.30]; // scores 1-5
      const rand = Math.random();
      let cumulative = 0;
      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (rand <= cumulative) {
          resolve(i + 1);
          return;
        }
      }
      resolve(4);
    }, 1800);
  });
}
