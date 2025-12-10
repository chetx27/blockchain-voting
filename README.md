# Blockchain Voting System

A modular blockchain based voting system designed as a bridge between an educational Python prototype and a production ready Ethereum stack. The repository now contains both the original Python implementation and a Hardhat based Solidity implementation so the project can be used for learning, demos, and ETHGlobal style hackathon submissions.

## Architecture Overview

This repository contains two complementary implementations of the same core idea.

- Python prototype
  - File: `blockchain_voting.py`
  - Implements a minimal blockchain data structure with proof of work, voter registration, vote casting, and chain validation in pure Python.
  - Useful for explaining concepts such as blocks, hashes, nonces, and basic consensus without needing a live network.

- Ethereum smart contract implementation
  - Contract: `contracts/VotingSystem.sol`
  - Stack: Solidity, Hardhat, Ethers, OpenZeppelin
  - Provides on chain voter registration, election creation, candidate management, vote casting, pausing, and result retrieval.
  - Designed to deploy on Ethereum testnets and L2s such as Sepolia, Optimism Sepolia, and Arbitrum Sepolia.

The goal is to make the transition clear: start with the Python version to understand the logic, then move to the Solidity version when targeting real networks and hackathons.

## Core Features

- Election lifecycle
  - Create named elections with a description and start end window.
  - Add multiple candidates per election before voting begins.
  - Finalize an election after it closes to lock in results.

- Voter flow
  - Self service voter registration on chain.
  - One person one vote per election enforced by contract storage rather than off chain checks.
  - Per election tracking so the same address can participate in multiple elections over time.

- Security and safety
  - Ownable administration for sensitive actions such as election creation and finalization.
  - ReentrancyGuard and Pausable from OpenZeppelin to guard critical paths and allow emergency pause.
  - Explicit checks for election existence, time windows, and candidate existence.

- Testing and tooling
  - Hardhat configuration for compilation, local node, and multi network deployment.
  - Scripted deployment and interaction flows in the `scripts` folder.
  - A Jest style test suite in `test/VotingSystem.test.js` covering deployment, election creation, candidate management, registration, voting, results, and pause logic.

## Getting Started

### Prerequisites

- Node.js LTS and npm or pnpm
- Python 3 if you want to run the original prototype
- A testnet RPC provider such as Alchemy or Infura for live deployments

### Installation

Clone the repository and install Node dependencies.

```sh
git clone https://github.com/chetx27/blockchain-voting.git
cd blockchain-voting
npm install
```

Create a local environment file based on the template.

```sh
cp .env.example .env
# Fill in RPC URLs, private key, and API keys
```

### Running the Python prototype

```sh
python blockchain_voting.py
```

This runs a scripted local election, mines blocks in memory, and prints chain state and results in the terminal.

### Compiling and testing the smart contracts

```sh
npx hardhat compile
npx hardhat test
```

Use the coverage and gas reporting scripts when iterating on contract logic.

```sh
REPORT_GAS=true npx hardhat test
npx hardhat coverage
```

### Local blockchain workflow

Run a local Hardhat node and deploy the contract.

```sh
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

Then use the interaction script to walk through an end to end election with created accounts.

```sh
CONTRACT_ADDRESS=deployed_contract_address \
  npx hardhat run scripts/interact.js --network localhost
```

### Testnet deployment

With `.env` configured and funded testnet account available, deploy to Sepolia or an L2 testnet.

```sh
npx hardhat run scripts/deploy.js --network sepolia
# or
npx hardhat run scripts/deploy.js --network optimismSepolia
```

The deploy script prints the contract address, deployer, and basic network information. If an Etherscan style API key is configured, it will also attempt verification.

## Project Structure

| Path                         | Purpose                                                        |
|-----------------------------|----------------------------------------------------------------|
| `blockchain_voting.py`      | Original Python based prototype for conceptual explanation     |
| `contracts/VotingSystem.sol`| Solidity smart contract for on chain elections                 |
| `hardhat.config.js`         | Hardhat configuration for networks, paths, and plugins         |
| `scripts/deploy.js`         | Deployment script for local and testnet environments           |
| `scripts/interact.js`       | Example script to create an election, register voters, and vote|
| `test/VotingSystem.test.js` | Automated tests for core contract behaviours                   |
| `package.json`              | Node dependencies and npm scripts                              |
| `.env.example`              | Reference environment configuration template                    |
| `.gitignore`                | Ignore rules for Node, Python, and build artifacts             |

## ETHGlobal Ready Notes

This repository is structured so it can be plugged into a full stack hackathon project without large refactors.

- Backend ready
  - Contracts follow a clear API that can be consumed from a React, Next.js, or mobile client through Ethers.
  - Events expose election creation, candidate addition, registration, and voting for indexing or subgraphs.

- Demo friendly
  - `scripts/interact.js` can be reused directly in a live demo or expanded into a seed script for a frontend.
  - Local and testnet flows are symmetrical so teams can iterate quickly and then switch networks days before a demo.

- Extension ideas
  - Add a minimal frontend in a `client` folder that connects to the deployed contract and surfaces the full voter flow.
  - Integrate identity or Sybil resistance modules such as World ID or BrightID to harden registration.
  - Explore privacy preserving upgrades, for example moving vote choices into a commit reveal or zero knowledge flow.

## License

This project is released under the MIT License. See the license file if one is added for exact terms.