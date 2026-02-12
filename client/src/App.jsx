import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import VoterDashboard from './components/VoterDashboard';
import AdminDashboard from './components/AdminDashboard';
import ElectionResults from './components/ElectionResults';
import VotingSystemABI from './contracts/VotingSystem.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initializeContract = useCallback(async (walletAccount) => {
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner(walletAccount);

    setProvider(browserProvider);
    setContract(new ethers.Contract(CONTRACT_ADDRESS, VotingSystemABI.abi, signer));
  }, []);

  useEffect(() => {
    checkWalletConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (account && contract) {
      checkUserStatus();
    }
  }, [account, contract]);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it to use this app.');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      setError('Missing VITE_CONTRACT_ADDRESS. Configure it in client/.env before connecting.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setAccount(account);

      await initializeContract(account);

      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());

    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setAccount('');
      setContract(null);
      setProvider(null);
      setIsOwner(false);
      setIsRegistered(false);
      return;
    }

    const nextAccount = accounts[0];
    setAccount(nextAccount);

    if (CONTRACT_ADDRESS) {
      await initializeContract(nextAccount);
    }
  };

  const checkUserStatus = async () => {
    try {
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());

      const voter = await contract.voters(account);
      setIsRegistered(voter.registered);
    } catch (err) {
      console.error('Error checking user status:', err);
    }
  };

  const registerVoter = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setError('');
      const tx = await contract.registerVoter();
      await tx.wait();
      setIsRegistered(true);
      alert('Successfully registered as a voter!');
    } catch (err) {
      setError('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Router>
      <div className="container">
        <header style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ color: '#667eea', margin: 0 }}>Blockchain Voting System</h1>
            <div>
              {!account ? (
                <button className="btn btn-primary" onClick={connectWallet} disabled={loading}>
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              ) : (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>
                    {isOwner && <span style={{ color: '#667eea', fontWeight: 'bold' }}>Admin</span>}
                    {isRegistered && !isOwner && <span style={{ color: '#48bb78', fontWeight: 'bold' }}>Registered Voter</span>}
                  </div>
                  <div style={{ fontSize: '14px', color: '#4a5568' }}>
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {account && (
            <nav style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
              <Link to="/" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
              {isOwner && <Link to="/admin" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>Admin</Link>}
              {isRegistered && <Link to="/vote" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>Vote</Link>}
              <Link to="/results" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>Results</Link>
            </nav>
          )}
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        <Routes>
          <Route path="/" element={
            <div className="card">
              <h2>Welcome to Decentralized Voting</h2>
              <p style={{ marginTop: '16px', color: '#718096', lineHeight: '1.6' }}>
                A transparent, secure, and tamper-proof voting system built on Ethereum blockchain.
                Connect your wallet to participate in elections.
              </p>
              
              {account && !isRegistered && !isOwner && (
                <div style={{ marginTop: '24px' }}>
                  <button className="btn btn-secondary" onClick={registerVoter} disabled={loading}>
                    {loading ? 'Registering...' : 'Register as Voter'}
                  </button>
                </div>
              )}
              
              {account && isRegistered && (
                <div className="alert alert-success" style={{ marginTop: '24px' }}>
                  You are registered and can participate in elections!
                </div>
              )}
            </div>
          } />
          <Route path="/admin" element={<AdminDashboard contract={contract} account={account} isOwner={isOwner} />} />
          <Route path="/vote" element={<VoterDashboard contract={contract} account={account} isRegistered={isRegistered} />} />
          <Route path="/results" element={<ElectionResults contract={contract} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;