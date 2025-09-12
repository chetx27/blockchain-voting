import hashlib
import json
import time
from datetime import datetime
from typing import List, Dict, Optional

class Vote:
    """Represents a single vote in the system"""
    def __init__(self, voter_id: str, candidate: str, timestamp: float = None):
        self.voter_id = voter_id
        self.candidate = candidate
        self.timestamp = timestamp or time.time()
    
    def to_dict(self) -> Dict:
        return {
            'voter_id': self.voter_id,
            'candidate': self.candidate,
            'timestamp': self.timestamp
        }

class Block:
    """Represents a block in the blockchain"""
    def __init__(self, index: int, votes: List[Vote], previous_hash: str):
        self.index = index
        self.timestamp = time.time()
        self.votes = votes
        self.previous_hash = previous_hash
        self.nonce = 0
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Calculate SHA-256 hash of the block"""
        block_string = json.dumps({
            'index': self.index,
            'timestamp': self.timestamp,
            'votes': [vote.to_dict() for vote in self.votes],
            'previous_hash': self.previous_hash,
            'nonce': self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def mine_block(self, difficulty: int = 2):
        """Mine the block with proof-of-work (simplified)"""
        target = "0" * difficulty
        print(f"Mining block {self.index}...")
        
        while not self.hash.startswith(target):
            self.nonce += 1
            self.hash = self.calculate_hash()
        
        print(f"Block {self.index} mined: {self.hash}")

class VotingBlockchain:
    """Main blockchain for the voting system"""
    def __init__(self):
        self.chain = [self.create_genesis_block()]
        self.pending_votes = []
        self.registered_voters = set()
        self.candidates = []
        self.voting_active = False
        self.votes_per_block = 3  # Number of votes per block
    
    def create_genesis_block(self) -> Block:
        """Create the first block in the chain"""
        return Block(0, [], "0")
    
    def get_latest_block(self) -> Block:
        """Get the most recent block"""
        return self.chain[-1]
    
    def register_voter(self, voter_id: str) -> bool:
        """Register a voter"""
        if voter_id in self.registered_voters:
            print(f"Voter {voter_id} is already registered!")
            return False
        
        self.registered_voters.add(voter_id)
        print(f"Voter {voter_id} registered successfully!")
        return True
    
    def add_candidate(self, candidate_name: str):
        """Add a candidate to the election"""
        if candidate_name not in self.candidates:
            self.candidates.append(candidate_name)
            print(f"Candidate '{candidate_name}' added to the election!")
    
    def start_voting(self):
        """Start the voting process"""
        if len(self.candidates) < 2:
            print("Need at least 2 candidates to start voting!")
            return False
        
        self.voting_active = True
        print("Voting has started!")
        print(f"Candidates: {', '.join(self.candidates)}")
        return True
    
    def stop_voting(self):
        """Stop the voting process"""
        self.voting_active = False
        print("Voting has ended!")
        
        # Mine any remaining pending votes
        if self.pending_votes:
            self.mine_pending_votes()
    
    def cast_vote(self, voter_id: str, candidate: str) -> bool:
        """Cast a vote"""
        if not self.voting_active:
            print("Voting is not currently active!")
            return False
        
        if voter_id not in self.registered_voters:
            print(f"Voter {voter_id} is not registered!")
            return False
        
        if candidate not in self.candidates:
            print(f"'{candidate}' is not a valid candidate!")
            return False
        
        # Check if voter has already voted
        if self.has_voted(voter_id):
            print(f"Voter {voter_id} has already cast their vote!")
            return False
        
        # Create and add vote
        vote = Vote(voter_id, candidate)
        self.pending_votes.append(vote)
        print(f"Vote cast by {voter_id} for {candidate}")
        
        # Mine block if we have enough votes
        if len(self.pending_votes) >= self.votes_per_block:
            self.mine_pending_votes()
        
        return True
    
    def has_voted(self, voter_id: str) -> bool:
        """Check if a voter has already voted"""
        # Check all blocks in the chain
        for block in self.chain[1:]:  # Skip genesis block
            for vote in block.votes:
                if vote.voter_id == voter_id:
                    return True
        
        # Check pending votes
        for vote in self.pending_votes:
            if vote.voter_id == voter_id:
                return True
        
        return False
    
    def mine_pending_votes(self):
        """Mine pending votes into a new block"""
        if not self.pending_votes:
            return
        
        # Create new block with pending votes
        new_block = Block(
            len(self.chain),
            self.pending_votes.copy(),
            self.get_latest_block().hash
        )
        
        # Mine the block
        new_block.mine_block()
        
        # Add to chain and clear pending votes
        self.chain.append(new_block)
        self.pending_votes = []
    
    def validate_chain(self) -> bool:
        """Validate the entire blockchain"""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i-1]
            
            # Check if current block's hash is valid
            if current_block.hash != current_block.calculate_hash():
                print(f"Invalid hash at block {i}")
                return False
            
            # Check if current block points to previous block
            if current_block.previous_hash != previous_block.hash:
                print(f"Invalid previous hash at block {i}")
                return False
        
        return True
    
    def get_results(self) -> Dict[str, int]:
        """Get voting results"""
        results = {candidate: 0 for candidate in self.candidates}
        
        # Count votes from all blocks
        for block in self.chain[1:]:  # Skip genesis block
            for vote in block.votes:
                if vote.candidate in results:
                    results[vote.candidate] += 1
        
        return results
    
    def display_results(self):
        """Display voting results"""
        results = self.get_results()
        total_votes = sum(results.values())
        
        print("\n" + "="*50)
        print("VOTING RESULTS")
        print("="*50)
        print(f"Total votes cast: {total_votes}")
        print("-"*50)
        
        # Sort candidates by vote count
        sorted_results = sorted(results.items(), key=lambda x: x[1], reverse=True)
        
        for candidate, votes in sorted_results:
            percentage = (votes / total_votes * 100) if total_votes > 0 else 0
            print(f"{candidate}: {votes} votes ({percentage:.1f}%)")
        
        if sorted_results:
            winner = sorted_results[0]
            if winner[1] > 0:
                print(f"\nWinner: {winner[0]} with {winner[1]} votes!")
        print("="*50)
    
    def display_blockchain_info(self):
        """Display blockchain information"""
        print(f"\nBlockchain Info:")
        print(f"Total blocks: {len(self.chain)}")
        print(f"Registered voters: {len(self.registered_voters)}")
        print(f"Pending votes: {len(self.pending_votes)}")
        print(f"Blockchain valid: {self.validate_chain()}")

def main():
    """Main function to demonstrate the voting system"""
    print("🗳️  BLOCKCHAIN VOTING SYSTEM")
    print("="*40)
    
    # Initialize blockchain
    voting_system = VotingBlockchain()
    
    # Register voters
    voters = ["alice", "bob", "charlie", "diana", "eve", "frank"]
    for voter in voters:
        voting_system.register_voter(voter)
    
    # Add candidates
    candidates = ["Alice Johnson", "Bob Smith", "Carol Davis"]
    for candidate in candidates:
        voting_system.add_candidate(candidate)
    
    # Start voting
    voting_system.start_voting()
    
    # Cast votes
    votes = [
        ("alice", "Alice Johnson"),
        ("bob", "Bob Smith"),
        ("charlie", "Alice Johnson"),
        ("diana", "Carol Davis"),
        ("eve", "Alice Johnson"),
        ("frank", "Bob Smith")
    ]
    
    for voter_id, candidate in votes:
        voting_system.cast_vote(voter_id, candidate)
    
    # Stop voting
    voting_system.stop_voting()
    
    # Display results
    voting_system.display_results()
    voting_system.display_blockchain_info()
    
    # Demonstrate blockchain validation
    print(f"\nBlockchain is valid: {voting_system.validate_chain()}")
    
    # Show some blockchain details
    print("\nBlockchain Details:")
    for i, block in enumerate(voting_system.chain):
        if i == 0:
            print(f"Block {i} (Genesis): Hash = {block.hash[:16]}...")
        else:
            print(f"Block {i}: {len(block.votes)} votes, Hash = {block.hash[:16]}...")

if __name__ == "__main__":
    main()