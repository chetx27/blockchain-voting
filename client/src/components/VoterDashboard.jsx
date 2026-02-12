import React, { useState, useEffect } from 'react';

function VoterDashboard({ contract, account, isRegistered }) {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contract && isRegistered) {
      loadElections();
    }
  }, [contract, isRegistered]);

  useEffect(() => {
    if (selectedElection && contract && account) {
      loadCandidates();
      checkVotingStatus();
    }
  }, [selectedElection, contract, account]);

  const loadElections = async () => {
    try {
      const count = await contract.electionCount();
      const electionsData = [];

      for (let i = 1; i <= count; i++) {
        const election = await contract.elections(i);
        electionsData.push({
          id: i,
          name: election.name,
          description: election.description,
          startTime: Number(election.startTime),
          endTime: Number(election.endTime),
          finalized: election.finalized,
          totalVotes: Number(election.totalVotes)
        });
      }

      setElections(electionsData);
    } catch (err) {
      console.error('Error loading elections:', err);
    }
  };

  const loadCandidates = async () => {
    try {
      const count = await contract.candidateCounts(selectedElection);
      const candidatesData = [];

      for (let i = 1; i <= count; i++) {
        const candidate = await contract.candidates(selectedElection, i);
        if (candidate.exists) {
          candidatesData.push({
            id: Number(candidate.id),
            name: candidate.name,
            voteCount: Number(candidate.voteCount)
          });
        }
      }

      setCandidates(candidatesData);
    } catch (err) {
      console.error('Error loading candidates:', err);
    }
  };

  const checkVotingStatus = async () => {
    try {
      const voted = await contract.hasAddressVoted(selectedElection, account);
      setHasVoted(voted);
    } catch (err) {
      console.error('Error checking voting status:', err);
    }
  };

  const castVote = async () => {
    if (!selectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const tx = await contract.vote(selectedElection, selectedCandidate);
      await tx.wait();
      alert('Vote cast successfully!');
      setHasVoted(true);
      await loadCandidates();
    } catch (err) {
      setError('Failed to cast vote: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isElectionActive = (election) => {
    if (!election) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return now >= election.startTime && now <= election.endTime && !election.finalized;
  };

  if (!isRegistered) {
    return (
      <div className="card">
        <h2>Voter Dashboard</h2>
        <div className="alert alert-info" style={{ marginTop: '16px' }}>
          You need to register as a voter first to access this section.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Active Elections</h2>
        {elections.length === 0 ? (
          <p style={{ color: '#718096', marginTop: '16px' }}>No elections available yet.</p>
        ) : (
          <div className="grid" style={{ marginTop: '16px' }}>
            {elections.map(election => (
              <div
                key={election.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: selectedElection === election.id ? '2px solid #667eea' : '2px solid transparent',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSelectedElection(election.id)}
              >
                <h3 style={{ color: '#667eea', marginBottom: '8px' }}>{election.name}</h3>
                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '12px' }}>
                  {election.description}
                </p>
                <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                  <div>Start: {new Date(election.startTime * 1000).toLocaleString()}</div>
                  <div>End: {new Date(election.endTime * 1000).toLocaleString()}</div>
                  <div style={{ marginTop: '8px', fontWeight: 'bold', color: isElectionActive(election) ? '#48bb78' : '#f56565' }}>
                    {isElectionActive(election) ? 'Active' : 'Closed'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedElection && (
        <div className="card">
          <h2>Cast Your Vote</h2>
          {error && <div className="alert alert-error">{error}</div>}
          
          {hasVoted ? (
            <div className="alert alert-success">
              You have already voted in this election.
            </div>
          ) : !isElectionActive(elections.find(e => e.id === selectedElection)) ? (
            <div className="alert alert-info">
              This election is not currently active.
            </div>
          ) : (
            <div>
              <div className="input-group">
                <label>Select Candidate</label>
                <select
                  value={selectedCandidate}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Choose a candidate...</option>
                  {candidates.map(candidate => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={castVote}
                disabled={loading || !selectedCandidate}
              >
                {loading ? 'Casting Vote...' : 'Submit Vote'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VoterDashboard;