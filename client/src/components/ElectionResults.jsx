import React, { useState, useEffect } from 'react';

function ElectionResults({ contract }) {
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract) {
      loadElections();
    }
  }, [contract]);

  useEffect(() => {
    if (selectedElectionId && contract) {
      loadResults();
    }
  }, [selectedElectionId]);

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
          totalVotes: Number(election.totalVotes),
          finalized: election.finalized
        });
      }

      setElections(electionsData);
      if (electionsData.length > 0) {
        setSelectedElectionId(electionsData[0].id);
      }
    } catch (err) {
      console.error('Error loading elections:', err);
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      const [ids, names, voteCounts] = await contract.getResults(selectedElectionId);
      
      const resultsData = ids.map((id, index) => ({
        id: Number(id),
        name: names[index],
        voteCount: Number(voteCounts[index])
      }));

      resultsData.sort((a, b) => b.voteCount - a.voteCount);
      setResults(resultsData);
    } catch (err) {
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedElection = elections.find(e => e.id === selectedElectionId);
  const totalVotes = selectedElection?.totalVotes || 0;

  return (
    <div>
      <div className="card">
        <h2>Election Results</h2>
        {elections.length === 0 ? (
          <p style={{ color: '#718096', marginTop: '16px' }}>No elections available yet.</p>
        ) : (
          <div className="input-group">
            <label>Select Election</label>
            <select
              value={selectedElectionId || ''}
              onChange={(e) => setSelectedElectionId(parseInt(e.target.value))}
            >
              {elections.map(election => (
                <option key={election.id} value={election.id}>
                  {election.name} - {election.totalVotes} votes
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedElectionId && (
        <div className="card">
          <h3 style={{ color: '#667eea', marginBottom: '8px' }}>
            {selectedElection?.name}
          </h3>
          <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
            {selectedElection?.description}
          </p>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#4a5568' }}>
            Total Votes Cast: {totalVotes}
          </div>

          {loading ? (
            <div className="spinner"></div>
          ) : results.length === 0 ? (
            <p style={{ color: '#718096' }}>No votes cast yet.</p>
          ) : (
            <div>
              {results.map((candidate, index) => {
                const percentage = totalVotes > 0 ? (candidate.voteCount / totalVotes * 100).toFixed(1) : 0;
                return (
                  <div key={candidate.id} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                          {index === 0 && candidate.voteCount > 0 ? '🏆 ' : ''}
                          {candidate.name}
                        </span>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#667eea' }}>
                        {candidate.voteCount} votes ({percentage}%)
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ElectionResults;