const hre = require('hardhat');

async function main() {
  console.log('Starting deployment...');
  
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH');
  
  const VotingSystem = await hre.ethers.getContractFactory('VotingSystem');
  console.log('Deploying VotingSystem contract...');
  
  const votingSystem = await VotingSystem.deploy();
  await votingSystem.waitForDeployment();
  
  const address = await votingSystem.getAddress();
  console.log('VotingSystem deployed to:', address);
  
  console.log('\nDeployment Summary:');
  console.log('Network:', hre.network.name);
  console.log('Contract Address:', address);
  console.log('Deployer:', deployer.address);
  
  if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
    console.log('\nWaiting for block confirmations...');
    await votingSystem.deploymentTransaction().wait(5);
    
    console.log('\nVerifying contract on Etherscan...');
    try {
      await hre.run('verify:verify', {
        address: address,
        constructorArguments: [],
      });
      console.log('Contract verified successfully');
    } catch (error) {
      console.log('Verification failed:', error.message);
    }
  }
  
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });