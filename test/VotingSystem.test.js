const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time, loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('VotingSystem', function () {
  async function deployVotingSystemFixture() {
    const [owner, voter1, voter2, voter3, voter4] = await ethers.getSigners();
    
    const VotingSystem = await ethers.getContractFactory('VotingSystem');
    const votingSystem = await VotingSystem.deploy();
    
    return { votingSystem, owner, voter1, voter2, voter3, voter4 };
  }
  
  describe('Deployment', function () {
    it('Should set the correct owner', async function () {
      const { votingSystem, owner } = await loadFixture(deployVotingSystemFixture);
      expect(await votingSystem.owner()).to.equal(owner.address);
    });
    
    it('Should initialize with zero elections', async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);
      expect(await votingSystem.electionCount()).to.equal(0);
    });
  });
  
  describe('Election Creation', function () {
    it('Should allow owner to create election', async function () {
      const { votingSystem, owner } = await loadFixture(deployVotingSystemFixture);
      
      await expect(votingSystem.createElection('Test Election', 'Description', 7))
        .to.emit(votingSystem, 'ElectionCreated')
        .withArgs(1, 'Test Election', await time.latest(), await time.latest() + 7 * 24 * 60 * 60);
      
      expect(await votingSystem.electionCount()).to.equal(1);
    });
    
    it('Should reject election creation from non-owner', async function () {
      const { votingSystem, voter1 } = await loadFixture(deployVotingSystemFixture);
      
      await expect(
        votingSystem.connect(voter1).createElection('Test Election', 'Description', 7)
      ).to.be.revertedWithCustomError(votingSystem, 'OwnableUnauthorizedAccount');
    });
    
    it('Should reject empty election name', async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);
      
      await expect(
        votingSystem.createElection('', 'Description', 7)
      ).to.be.revertedWith('Election name cannot be empty');
    });
    
    it('Should reject zero duration', async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);
      
      await expect(
        votingSystem.createElection('Test', 'Description', 0)
      ).to.be.revertedWith('Duration must be greater than 0');
    });
  });
  
  describe('Candidate Management', function () {
    it('Should allow owner to add candidates', async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);
      
      await votingSystem.createElection('Test Election', 'Description', 7);
      
      await expect(votingSystem.addCandidate(1, 'Alice'))
        .to.emit(votingSystem, 'CandidateAdded')
        .withArgs(1, 1, 'Alice');
      
      const candidate = await votingSystem.getCandidate(1, 1);
      expect(candidate.name).to.equal('Alice');
    });
    
    it('Should reject empty candidate name', async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);
      
      await votingSystem.createElection('Test Election', 'Description', 7);
      
      await expect(
        votingSystem.addCandidate(1, '')
      ).to.be.revertedWith('Candidate name cannot be empty');
    });
    
    it('Should not allow adding candidates after election starts', async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);
      
      await votingSystem.createElection('Test Election', 'Description', 7);
      await time.increase(1);
      
      await expect(
        votingSystem.addCandidate(1, 'Bob')
      ).to.be.revertedWith('Cannot add candidates after election starts');
    });
  });
  
  describe('Voter Registration', function () {
    it('Should allow voter registration', async function () {
      const { votingSystem, voter1 } = await loadFixture(deployVotingSystemFixture);
      
      await expect(votingSystem.connect(voter1).registerVoter())
        .to.emit(votingSystem, 'VoterRegistered');
      
      const voter = await votingSystem.voters(voter1.address);
      expect(voter.registered).to.be.true;
    });
    
    it('Should reject duplicate registration', async function () {
      const { votingSystem, voter1 } = await loadFixture(deployVotingSystemFixture);
      
      await votingSystem.connect(voter1).registerVoter();
      
      await expect(
        votingSystem.connect(voter1).registerVoter()
      ).to.be.revertedWith('Voter already registered');
    });
  });
  
  describe('Voting Process', function () {
    async function setupElectionFixture() {
      const fixture = await deployVotingSystemFixture();
      const { votingSystem, voter1, voter2 } = fixture;
      
      await votingSystem.createElection('Test Election', 'Description', 7);
      await votingSystem.addCandidate(1, 'Alice');
      await votingSystem.addCandidate(1, 'Bob');
      
      await votingSystem.connect(voter1).registerVoter();
      await votingSystem.connect(voter2).registerVoter();
      
      return fixture;
    }
    
    it('Should allow registered voter to cast vote', async function () {
      const { votingSystem, voter1 } = await loadFixture(setupElectionFixture);
      
      await expect(votingSystem.connect(voter1).vote(1, 1))
        .to.emit(votingSystem, 'VoteCast')
        .withArgs(voter1.address, 1, 1, await time.latest());
      
      const candidate = await votingSystem.getCandidate(1, 1);
      expect(candidate.voteCount).to.equal(1);
    });
    
    it('Should prevent double voting', async function () {
      const { votingSystem, voter1 } = await loadFixture(setupElectionFixture);
      
      await votingSystem.connect(voter1).vote(1, 1);
      
      await expect(
        votingSystem.connect(voter1).vote(1, 2)
      ).to.be.revertedWith('Already voted in this election');
    });
    
    it('Should reject vote from unregistered voter', async function () {
      const { votingSystem, voter3 } = await loadFixture(setupElectionFixture);
      
      await expect(
        votingSystem.connect(voter3).vote(1, 1)
      ).to.be.revertedWith('Voter not registered');
    });
    
    it('Should reject vote for non-existent candidate', async function () {
      const { votingSystem, voter1 } = await loadFixture(setupElectionFixture);
      
      await expect(
        votingSystem.connect(voter1).vote(1, 999)
      ).to.be.revertedWith('Candidate does not exist');
    });
    
    it('Should update total votes correctly', async function () {
      const { votingSystem, voter1, voter2 } = await loadFixture(setupElectionFixture);
      
      await votingSystem.connect(voter1).vote(1, 1);
      await votingSystem.connect(voter2).vote(1, 2);
      
      const election = await votingSystem.elections(1);
      expect(election.totalVotes).to.equal(2);
    });
  });
  
  describe('Results and Finalization', function () {
    async function setupVotedElectionFixture() {
      const fixture = await deployVotingSystemFixture();
      const { votingSystem, voter1, voter2, voter3 } = fixture;
      
      await votingSystem.createElection('Test Election', 'Description', 7);
      await votingSystem.addCandidate(1, 'Alice');
      await votingSystem.addCandidate(1, 'Bob');
      await votingSystem.addCandidate(1, 'Carol');
      
      await votingSystem.connect(voter1).registerVoter();
      await votingSystem.connect(voter2).registerVoter();
      await votingSystem.connect(voter3).registerVoter();
      
      await votingSystem.connect(voter1).vote(1, 1);
      await votingSystem.connect(voter2).vote(1, 1);
      await votingSystem.connect(voter3).vote(1, 2);
      
      return fixture;
    }
    
    it('Should return correct results', async function () {
      const { votingSystem } = await loadFixture(setupVotedElectionFixture);
      
      const results = await votingSystem.getResults(1);
      
      expect(results[1][0]).to.equal('Alice');
      expect(results[2][0]).to.equal(2);
      expect(results[1][1]).to.equal('Bob');
      expect(results[2][1]).to.equal(1);
    });
    
    it('Should allow finalization after election ends', async function () {
      const { votingSystem } = await loadFixture(setupVotedElectionFixture);
      
      await time.increase(8 * 24 * 60 * 60);
      
      await expect(votingSystem.finalizeElection(1))
        .to.emit(votingSystem, 'ElectionFinalized')
        .withArgs(1, 3);
      
      const election = await votingSystem.elections(1);
      expect(election.finalized).to.be.true;
    });
    
    it('Should reject finalization before election ends', async function () {
      const { votingSystem } = await loadFixture(setupVotedElectionFixture);
      
      await expect(
        votingSystem.finalizeElection(1)
      ).to.be.revertedWith('Election is still active');
    });
  });
  
  describe('Pause Functionality', function () {
    it('Should allow owner to pause contract', async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);
      
      await votingSystem.pause();
      expect(await votingSystem.paused()).to.be.true;
    });
    
    it('Should prevent voting when paused', async function () {
      const { votingSystem, voter1 } = await loadFixture(deployVotingSystemFixture);
      
      await votingSystem.createElection('Test', 'Desc', 7);
      await votingSystem.addCandidate(1, 'Alice');
      await votingSystem.connect(voter1).registerVoter();
      await votingSystem.pause();
      
      await expect(
        votingSystem.connect(voter1).vote(1, 1)
      ).to.be.revertedWithCustomError(votingSystem, 'EnforcedPause');
    });
  });
});