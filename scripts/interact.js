const hre = require('hardhat');

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error('Please set CONTRACT_ADDRESS environment variable');
    process.exit(1);
  }
  
  const VotingSystem = await hre.ethers.getContractFactory('VotingSystem');
  const votingSystem = VotingSystem.attach(contractAddress);
  
  console.log('Interacting with VotingSystem at:', contractAddress);
  
  const [owner, voter1, voter2, voter3] = await hre.ethers.getSigners();
  
  console.log('\nCreating election...');
  const tx1 = await votingSystem.createElection(
    'Campus President Election 2025',
    'Annual student body president election',
    7
  );
  await tx1.wait();
  console.log('Election created');
  
  const electionId = await votingSystem.currentElectionId();
  console.log('Election ID:', electionId.toString());
  
  console.log('\nAdding candidates...');
  const candidates = ['Alice Johnson', 'Bob Smith', 'Carol Davis'];
  
  for (const candidate of candidates) {
    const tx = await votingSystem.addCandidate(electionId, candidate);
    await tx.wait();
    console.log('Added candidate:', candidate);
  }
  
  console.log('\nRegistering voters...');
  const voters = [voter1, voter2, voter3];
  
  for (const voter of voters) {
    const tx = await votingSystem.connect(voter).registerVoter();
    await tx.wait();
    console.log('Registered voter:', voter.address);
  }
  
  console.log('\nCasting votes...');
  const voteTx1 = await votingSystem.connect(voter1).vote(electionId, 1);
  await voteTx1.wait();
  console.log('Voter 1 voted for candidate 1');
  
  const voteTx2 = await votingSystem.connect(voter2).vote(electionId, 1);
  await voteTx2.wait();
  console.log('Voter 2 voted for candidate 1');
  
  const voteTx3 = await votingSystem.connect(voter3).vote(electionId, 2);
  await voteTx3.wait();
  console.log('Voter 3 voted for candidate 2');
  
  console.log('\nFetching results...');
  const results = await votingSystem.getResults(electionId);
  
  console.log('\nElection Results:');
  for (let i = 0; i < results[0].length; i++) {
    console.log(`${results[1][i]}: ${results[2][i]} votes`);
  }
  
  const election = await votingSystem.elections(electionId);
  console.log('\nTotal votes cast:', election.totalVotes.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });