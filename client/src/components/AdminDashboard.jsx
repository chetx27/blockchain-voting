import React, { useState, useEffect } from 'react';

function AdminDashboard({ contract, account, isOwner }) {
  const [electionName, setElectionName] = useState('');
  const [electionDescription, setElectionDescription] = useState('');
  const [electionDuration, setElectionDuration] = useState('7');
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [elections, setElections] = useState([]);

  useEffect(() => {
    if (contract && isOwner) {
      loadElections();
    }
  }, [contract, isOwner]);

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

  const createElection = async (e) => {
    e.preventDefault();
    if (!electionName || !electionDescription || !electionDuration) {
      setError('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const tx = await contract.createElection(
        electionName,
        electionDescription,
        parseInt(electionDuration)
      );
      await tx.wait();
      setSuccess('Election created successfully!');
      setElectionName('');
      setElectionDescription('');
      setElectionDuration('7');
      await loadElections();
    } catch (err) {
      setError('Failed to create election: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCandidate = async (e) => {
    e.preventDefault();
    if (!selectedElectionId || !candidateName) {
      setError('Please select election and enter candidate name');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const tx = await contract.addCandidate(parseInt(selectedElectionId), candidateName);
      await tx.wait();
      setSuccess('Candidate added successfully!');
      setCandidateName('');
    } catch (err) {
      setError('Failed to add candidate: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const finalizeElection = async (electionId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const tx = await contract.finalizeElection(electionId);
      await tx.wait();
      setSuccess('Election finalized successfully!');
      await loadElections();
    } catch (err) {
      setError('Failed to finalize election: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="card">
        <h2>Admin Dashboard</h2>
        <div className="alert alert-error" style={{ marginTop: '16px' }}>
          You do not have admin privileges.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Create New Election</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <form onSubmit={createElection}>
          <div className="input-group">
            <label>Election Name</label>
            <input
              type="text"
              value={electionName}
              onChange={(e) => setElectionName(e.target.value)}
              placeholder="e.g., Student Council Election 2025"
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <label>Description</label>
            <textarea
              value={electionDescription}
              onChange={(e) => setElectionDescription(e.target.value)}
              placeholder="Provide details about this election"
              rows="3"
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <label>Duration (days)</label>
            <input
              type="number"
              value={electionDuration}
              onChange={(e) => setElectionDuration(e.target.value)}
              min="1"
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Election'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Add Candidate</h2>
        <form onSubmit={addCandidate}>
          <div className="input-group">
            <label>Select Election</label>
            <select
              value={selectedElectionId}
              onChange={(e) => setSelectedElectionId(e.target.value)}
              disabled={loading}
            >
              <option value="">Choose an election...</option>
              {elections.map(election => (
                <option key={election.id} value={election.id}>
                  {election.name} (ID: {election.id})
                </option>
              ))}
            </select>
          </div>
          
          <div className="input-group">
            <label>Candidate Name</label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter candidate name"
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="btn btn-secondary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Candidate'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Manage Elections</h2>
        {elections.length === 0 ? (
          <p style={{ color: '#718096' }}>No elections created yet.</p>
        ) : (
          <div style={{ marginTop: '16px' }}>
            {elections.map(election => {
              const now = Math.floor(Date.now() / 1000);
              const canFinalize = now > election.endTime && !election.finalized;
              
              return (
                <div key={election.id} className="card" style={{ marginBottom: '12px' }}>
                  <h3 style={{ color: '#667eea' }}>{election.name}</h3>
                  <p style={{ fontSize: '14px', color: '#718096', margin: '8px 0' }}>
                    {election.description}
                  </p>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '12px' }}>
                    <div>Total Votes: {election.totalVotes}</div>
                    <div>End: {new Date(election.endTime * 1000).toLocaleString()}</div>
                    <div style={{ fontWeight: 'bold', color: election.finalized ? '#48bb78' : '#f6ad55' }}>
                      {election.finalized ? 'Finalized' : 'Active'}
                    </div>
                  </div>
                  {canFinalize && (
                    <button
                      className="btn btn-primary"
                      onClick={() => finalizeElection(election.id)}
                      disabled={loading}
                    >
                      Finalize Election
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;