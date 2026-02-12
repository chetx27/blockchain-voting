// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VotingSystem
 * @dev Decentralized voting system with voter registration, secure vote casting, and result tallying
 * @notice This contract manages elections on the blockchain with transparency and immutability
 */
contract VotingSystem is Ownable, ReentrancyGuard, Pausable {
    
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
        bool exists;
    }
    
    struct Election {
        uint256 id;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool finalized;
        uint256 totalVotes;
    }
    
    struct Voter {
        bool registered;
        bool hasVoted;
        uint256 votedElectionId;
        uint256 votedCandidateId;
        uint256 registrationTime;
    }
    
    uint256 public electionCount;
    uint256 public currentElectionId;
    
    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;
    mapping(uint256 => uint256) public candidateCounts;
    mapping(address => Voter) public voters;
    mapping(uint256 => mapping(address => bool)) public hasVotedInElection;
    
    event ElectionCreated(uint256 indexed electionId, string name, uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 candidateId, string name);
    event VoterRegistered(address indexed voter, uint256 timestamp);
    event VoteCast(address indexed voter, uint256 indexed electionId, uint256 indexed candidateId, uint256 timestamp);
    event ElectionFinalized(uint256 indexed electionId, uint256 totalVotes);
    
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].registered, "Voter not registered");
        _;
    }
    
    modifier electionExists(uint256 _electionId) {
        require(_electionId > 0 && _electionId <= electionCount, "Election does not exist");
        _;
    }
    
    modifier electionActive(uint256 _electionId) {
        Election memory election = elections[_electionId];
        require(block.timestamp >= election.startTime, "Election has not started yet");
        require(block.timestamp <= election.endTime, "Election has ended");
        require(!election.finalized, "Election has been finalized");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        electionCount = 0;
    }
    
    /**
     * @dev Create a new election
     * @param _name Name of the election
     * @param _description Description of the election
     * @param _durationInDays Duration of the election in days
     */
    function createElection(
        string memory _name,
        string memory _description,
        uint256 _durationInDays
    ) external onlyOwner {
        require(bytes(_name).length > 0, "Election name cannot be empty");
        require(_durationInDays > 0, "Duration must be greater than 0");
        
        electionCount++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (_durationInDays * 1 days);
        
        elections[electionCount] = Election({
            id: electionCount,
            name: _name,
            description: _description,
            startTime: startTime,
            endTime: endTime,
            finalized: false,
            totalVotes: 0
        });
        
        currentElectionId = electionCount;
        
        emit ElectionCreated(electionCount, _name, startTime, endTime);
    }
    
    /**
     * @dev Add a candidate to an election
     * @param _electionId ID of the election
     * @param _name Name of the candidate
     */
    function addCandidate(uint256 _electionId, string memory _name) 
        external 
        onlyOwner 
        electionExists(_electionId) 
    {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        require(!elections[_electionId].finalized, "Election already finalized");
        require(elections[_electionId].totalVotes == 0, "Cannot add candidates after voting begins");
        
        uint256 candidateId = candidateCounts[_electionId] + 1;
        candidateCounts[_electionId] = candidateId;
        
        candidates[_electionId][candidateId] = Candidate({
            id: candidateId,
            name: _name,
            voteCount: 0,
            exists: true
        });
        
        emit CandidateAdded(_electionId, candidateId, _name);
    }
    
    /**
     * @dev Register a voter
     */
    function registerVoter() external whenNotPaused {
        require(!voters[msg.sender].registered, "Voter already registered");
        
        voters[msg.sender] = Voter({
            registered: true,
            hasVoted: false,
            votedElectionId: 0,
            votedCandidateId: 0,
            registrationTime: block.timestamp
        });
        
        emit VoterRegistered(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Cast a vote for a candidate
     * @param _electionId ID of the election
     * @param _candidateId ID of the candidate
     */
    function vote(uint256 _electionId, uint256 _candidateId) 
        external 
        nonReentrant
        whenNotPaused
        onlyRegisteredVoter
        electionExists(_electionId)
        electionActive(_electionId)
    {
        require(!hasVotedInElection[_electionId][msg.sender], "Already voted in this election");
        require(candidates[_electionId][_candidateId].exists, "Candidate does not exist");
        
        candidates[_electionId][_candidateId].voteCount++;
        elections[_electionId].totalVotes++;
        
        hasVotedInElection[_electionId][msg.sender] = true;
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedElectionId = _electionId;
        voters[msg.sender].votedCandidateId = _candidateId;
        
        emit VoteCast(msg.sender, _electionId, _candidateId, block.timestamp);
    }
    
    /**
     * @dev Finalize an election after it ends
     * @param _electionId ID of the election to finalize
     */
    function finalizeElection(uint256 _electionId) 
        external 
        onlyOwner 
        electionExists(_electionId) 
    {
        Election storage election = elections[_electionId];
        require(block.timestamp > election.endTime, "Election is still active");
        require(!election.finalized, "Election already finalized");
        
        election.finalized = true;
        
        emit ElectionFinalized(_electionId, election.totalVotes);
    }
    
    /**
     * @dev Get election results
     * @param _electionId ID of the election
     * @return candidateIds Array of candidate IDs
     * @return names Array of candidate names
     * @return voteCounts Array of vote counts
     */
    function getResults(uint256 _electionId) 
        external 
        view 
        electionExists(_electionId) 
        returns (
            uint256[] memory candidateIds,
            string[] memory names,
            uint256[] memory voteCounts
        ) 
    {
        uint256 count = candidateCounts[_electionId];
        candidateIds = new uint256[](count);
        names = new string[](count);
        voteCounts = new uint256[](count);
        
        for (uint256 i = 1; i <= count; i++) {
            Candidate memory candidate = candidates[_electionId][i];
            candidateIds[i - 1] = candidate.id;
            names[i - 1] = candidate.name;
            voteCounts[i - 1] = candidate.voteCount;
        }
        
        return (candidateIds, names, voteCounts);
    }
    
    /**
     * @dev Get candidate details
     * @param _electionId ID of the election
     * @param _candidateId ID of the candidate
     */
    function getCandidate(uint256 _electionId, uint256 _candidateId) 
        external 
        view 
        electionExists(_electionId)
        returns (uint256 id, string memory name, uint256 voteCount) 
    {
        Candidate memory candidate = candidates[_electionId][_candidateId];
        require(candidate.exists, "Candidate does not exist");
        return (candidate.id, candidate.name, candidate.voteCount);
    }
    
    /**
     * @dev Check if address has voted in specific election
     */
    function hasAddressVoted(uint256 _electionId, address _voter) 
        external 
        view 
        returns (bool) 
    {
        return hasVotedInElection[_electionId][_voter];
    }
    
    /**
     * @dev Pause the contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
