# Based Smiles 😊

> Earn 0.001 USDC for every genuine smile — verified on-chain by Openputer AI Oracle on Base Network.

## Project Structure

```
based-smiles/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main page
│   │   ├── layout.tsx            # Root layout with Privy provider
│   │   └── globals.css           # Global styles + animations
│   ├── components/
│   │   ├── CameraCapture.tsx     # Camera feed, capture, oracle flow
│   │   ├── SmileGallery.tsx      # On-chain gallery + smile-back
│   │   ├── StatsBar.tsx          # Daily stats (smiles, USDC, pool)
│   │   ├── WalletButton.tsx      # Privy connect/disconnect
│   │   └── PrivyProviderWrapper.tsx
│   ├── hooks/
│   │   └── useSmileStats.ts      # Contract stats polling hook
│   └── lib/
│       ├── oracle.ts             # Openputer AI Oracle integration
│       ├── contract.ts           # Smart contract interactions
│       └── imageUtils.ts         # Image compression utility
├── .env.local.example            # Environment variable template
├── .gitignore
├── package.json
├── tailwind.config.ts
├── next.config.mjs
└── tsconfig.json
```

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/based-smiles.git
cd based-smiles
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and fill in your values:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here
NEXT_PUBLIC_ORACLE_ADDRESS=your_openputer_oracle_address_here
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_MOCK_ORACLE=true   # set to false for production
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** With `NEXT_PUBLIC_MOCK_ORACLE=true`, the app runs fully without a deployed contract — the oracle returns simulated scores and transactions are mocked. Perfect for development.

---

## Getting Your Keys

### Privy App ID
1. Go to [privy.io](https://privy.io) and create an account
2. Create a new app
3. Copy the **App ID** from the dashboard
4. Paste it into `NEXT_PUBLIC_PRIVY_APP_ID`

### Contract Address
Deploy the `BasedSmiles.sol` contract (see `/contracts` folder) to Base Network:
```bash
# Using Hardhat
npx hardhat run scripts/deploy.ts --network base
```
Copy the deployed address into `NEXT_PUBLIC_CONTRACT_ADDRESS`.

### Oracle Address
Register with [Openputer](https://openputer.com) to get your oracle contract address and paste it into `NEXT_PUBLIC_ORACLE_ADDRESS`.

---

## Deploying to Production

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

During setup, Vercel will ask for your environment variables — paste the same values from your `.env.local`.

Or connect your GitHub repo directly on [vercel.com](https://vercel.com) for auto-deploy on every push.

### Manual build

```bash
npm run build
npm start
```

---

## Smart Contract

The contract lives at `/contracts/BasedSmiles.sol` (deploy separately using Hardhat or Foundry).

Key functions:
| Function | Description |
|---|---|
| `submitSmile(imageData, score)` | Submit a smile + claim 0.001 USDC if score > 3 |
| `smileBack(smileId)` | React to someone else's smile |
| `fundPool()` | Add USDC to the community reward pool |
| `getSmile(id)` | Fetch a smile entry from the gallery |
| `totalSmiles()` | Total winning smiles submitted |
| `getPoolBalance()` | Current USDC pool balance |

---

## Development Notes

- Set `NEXT_PUBLIC_MOCK_ORACLE=true` to skip real contract calls during development
- The camera auto-starts in selfie (mirrored) mode
- Images are compressed to max 800×600 JPEG before being sent to the oracle
- A 60-second cooldown prevents spam after each successful smile
- The Nouns filter adds a fun 🤓 glasses overlay (cosmetic only)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Auth | Privy (wallet + email login) |
| Blockchain | Base Network, ethers.js v6 |
| AI Oracle | Openputer (built on Coinbase Developer Platform) |
| Deployment | Vercel |

---

## Contributing

Pull requests welcome! Please open an issue first to discuss major changes.

## License

MIT
