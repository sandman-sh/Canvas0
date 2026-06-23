# Canvas0

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![0G Galileo](https://img.shields.io/badge/0G%20Chain-Galileo%20Testnet-purple)](https://0g.ai/)

Canvas0 is a high-performance, real-time collaborative whiteboard and digital design workspace. It combines instant multi-user synchronization with Web3 wallet authentication, AI-driven asset generation, and decentralized asset provenance tracking secured directly on the **0G Galileo Testnet**.

Designed for designers, developers, and creators, Canvas0 bridges the gap between collaborative flat design systems and immutable blockchain-based content registration.

---

## Key Features

- **Real-Time Collaboration**: Instant synchronization of design assets, layouts, and active user cursors across rooms. Cursors are isolated at the tab level using `sessionStorage` keys, enabling easy local testing across multiple browser tabs.
- **AI-Powered Asset Generator**: Generate rich text taglines, marketing copy, custom responsive inline SVG graphics, and design shapes using LLMs integrated via OpenRouter. Toggle the panel by clicking the toolbar's Sparkles button (which highlights green when active) or pressing the `A` hotkey.
- **Web3 Wallet Integration (Optional)**: Connect EVM-compatible wallets (MetaMask, Coinbase Wallet, OKX Wallet, Phantom) to verify Web3 identity, or join instantly as a guest simply by providing a Name.
- **On-Chain Asset Provenance**: Auto-register asset creation events directly on the 0G Galileo Testnet. Metadata (User ID/Name, timestamp, prompt hash, and asset ID) is logged immutably via self-signed EVM transactions sponsored by the server.
- **Interactive Object Inspector**: Take total control over canvas elements with real-time adjustments for:
  - Transformations (position, dimensions, rotation)
  - Layering (Z-index ordering)
  - Constraints (aspect ratio and movement locking)
  - Colors, strokes, opacity, blend modes, and CSS filters
  - Procedural GLSL shader editing for interactive graphics
- **Flat UI Design System**: A premium, high-contrast design language built with custom styles and micro-animations.

---

## Architecture & Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack) & [React 19](https://react.dev/)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
- **Real-time Engine**: [Supabase](https://supabase.com/) (PostgreSQL & Realtime engine)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS with custom utility components
- **Web3 Connection**: [Ethers.js v6](https://docs.ethers.org/v6/)
- **AI Orchestration**: [OpenRouter API](https://openrouter.ai/) (supporting Gemma-2-9b and fallback models)

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://www.npmjs.com/) (or `yarn` / `pnpm` / `bun`)

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/sandman-sh/Canvas0.git
   cd Canvas0
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment template to create your local configurations:
   ```bash
   cp .env.example .env.local
   ```

4. **Fill in `.env.local`**:
   Open `.env.local` and provide your credentials:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # OpenRouter API Key for AI Generation
   OPENROUTER_API_KEY=your_openrouter_api_key

   # 0G Storage Gateway Config (REST API Gateway)
   NEXT_PUBLIC_ZG_STORAGE_GATEWAY=https://storage-gateway.testnet.0g.ai

   # 0G Chain (EVM Galileo Testnet) Config
   NEXT_PUBLIC_ZG_RPC_URL=https://evmrpc-testnet.0g.ai
   ZG_WALLET_PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
   NEXT_PUBLIC_PROVENANCE_CONTRACT_ADDRESS=
   ```

---

## Local Development

Start the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the workspace.

### Building for Production

Compile the production bundle:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

---

## Code Quality and Linting

Validate code formatting and potential issues using ESLint:

```bash
npm run lint
```

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more information.
