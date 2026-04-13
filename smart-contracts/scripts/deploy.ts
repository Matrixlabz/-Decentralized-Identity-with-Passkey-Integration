import { 
  StellarKeypair, 
  Contract, 
  TransactionBuilder, 
  Networks,
  BASE_FEE,
  Asset,
  Operation
} from '@stellar/stellar-sdk'
import { IdentityRegistry } from '../contracts/IdentityRegistry'
import { SelectiveDisclosure } from '../contracts/SelectiveDisclosure'
import { config } from 'dotenv'

config()

interface ContractDeployment {
  name: string
  contractId: string
  address: string
  deployedAt: Date
}

interface DeploymentConfig {
  network: 'mainnet' | 'testnet' | 'standalone'
  horizonUrl: string
  networkPassphrase: string
  secretKey?: string
  publicKey?: string
}

const NETWORKS: Record<string, DeploymentConfig> = {
  mainnet: {
    network: 'mainnet',
    horizonUrl: 'https://horizon.stellar.org',
    networkPassphrase: Networks.PUBLIC,
    secretKey: process.env.MAINNET_SECRET_KEY,
    publicKey: process.env.MAINNET_PUBLIC_KEY,
  },
  testnet: {
    network: 'testnet',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
    secretKey: process.env.TESTNET_SECRET_KEY,
    publicKey: process.env.TESTNET_PUBLIC_KEY,
  },
  standalone: {
    network: 'standalone',
    horizonUrl: 'http://localhost:8000',
    networkPassphrase: Networks.STANDALONE,
    secretKey: process.env.STANDALONE_SECRET_KEY,
    publicKey: process.env.STANDALONE_PUBLIC_KEY,
  },
}

async function deployContract(
  config: DeploymentConfig,
  contractName: string,
  wasmFilePath: string
): Promise<ContractDeployment> {
  if (!config.secretKey || !config.publicKey) {
    throw new Error(`Missing credentials for ${config.network}`)
  }

  const keypair = StellarKeypair.fromSecret(config.secretKey!)
  const server = new StellarServer(config.horizonUrl)
  
  console.log(`Deploying ${contractName} to ${config.network}...`)

  try {
    // Load the WASM file (in real implementation, this would be compiled)
    const wasmCode = await loadWasmFile(wasmFilePath)
    
    // Create the contract
    const contract = new Contract(wasmCode)
    
    // Get account details
    const account = await server.loadAccount(config.publicKey!)
    
    // Build transaction to create contract
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        Operation.createCustomContract({
          wasmHash: contract.wasmHash(),
        })
      )
      .setTimeout(30)
      .build()

    // Sign transaction
    transaction.sign(keypair)
    
    // Submit transaction
    const result = await server.submitTransaction(transaction)
    
    if (!result.successful) {
      throw new Error(`Contract deployment failed: ${result.resultXdr}`)
    }

    const contractAddress = contract.address().toString()
    
    console.log(`Successfully deployed ${contractName}`)
    console.log(`Contract Address: ${contractAddress}`)
    console.log(`Transaction Hash: ${result.hash}`)

    return {
      name: contractName,
      contractId: contract.wasmHash().toString('hex'),
      address: contractAddress,
      deployedAt: new Date(),
    }
  } catch (error) {
    console.error(`Failed to deploy ${contractName}:`, error)
    throw error
  }
}

async function loadWasmFile(filePath: string): Promise<Buffer> {
  // In a real implementation, this would load the compiled WASM file
  // For now, return a mock WASM hash
  console.log(`Loading WASM from ${filePath}...`)
  return Buffer.from('mock_wasm_content')
}

async function initializeContracts(
  config: DeploymentConfig,
  deployments: ContractDeployment[]
): Promise<void> {
  const keypair = StellarKeypair.fromSecret(config.secretKey!)
  const server = new StellarServer(config.horizonUrl)
  
  console.log('Initializing contracts...')

  for (const deployment of deployments) {
    try {
      const account = await server.loadAccount(config.publicKey!)
      
      let transaction: TransactionBuilder
      
      if (deployment.name === 'IdentityRegistry') {
        const registry = new IdentityRegistry(deployment.address, config.networkPassphrase)
        transaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: config.networkPassphrase,
        }).addOperation(registry.initialize(keypair.publicKey()))
      } else if (deployment.name === 'SelectiveDisclosure') {
        const disclosure = new SelectiveDisclosure(deployment.address, config.networkPassphrase)
        transaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: config.networkPassphrase,
        }).addOperation(disclosure.initialize(keypair.publicKey()))
      } else {
        continue
      }

      const finalTx = transaction.setTimeout(30).build()
      finalTx.sign(keypair)
      
      const result = await server.submitTransaction(finalTx)
      
      if (result.successful) {
        console.log(`Successfully initialized ${deployment.name}`)
      } else {
        throw new Error(`Initialization failed: ${result.resultXdr}`)
      }
    } catch (error) {
      console.error(`Failed to initialize ${deployment.name}:`, error)
      throw error
    }
  }
}

async function saveDeploymentInfo(
  network: string,
  deployments: ContractDeployment[]
): Promise<void> {
  const deploymentInfo = {
    network,
    deployedAt: new Date().toISOString(),
    contracts: deployments,
  }

  const fs = require('fs')
  const path = `deployment/${network}-deployment.json`
  
  try {
    fs.writeFileSync(path, JSON.stringify(deploymentInfo, null, 2))
    console.log(`Deployment info saved to ${path}`)
  } catch (error) {
    console.error('Failed to save deployment info:', error)
  }
}

async function main(): Promise<void> {
  const network = process.argv[2] || 'testnet'
  
  if (!NETWORKS[network]) {
    console.error(`Invalid network: ${network}`)
    console.log('Available networks: mainnet, testnet, standalone')
    process.exit(1)
  }

  const config = NETWORKS[network]
  
  console.log(`Starting deployment to ${network}...`)
  
  try {
    const deployments: ContractDeployment[] = []
    
    // Deploy Identity Registry
    const identityRegistry = await deployContract(
      config,
      'IdentityRegistry',
      'contracts/identity_registry.wasm'
    )
    deployments.push(identityRegistry)
    
    // Deploy Selective Disclosure
    const selectiveDisclosure = await deployContract(
      config,
      'SelectiveDisclosure',
      'contracts/selective_disclosure.wasm'
    )
    deployments.push(selectiveDisclosure)
    
    // Initialize contracts
    await initializeContracts(config, deployments)
    
    // Save deployment information
    await saveDeploymentInfo(network, deployments)
    
    console.log('Deployment completed successfully!')
    console.log('\nContract Summary:')
    deployments.forEach(deployment => {
      console.log(`- ${deployment.name}: ${deployment.address}`)
    })
    
  } catch (error) {
    console.error('Deployment failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}
