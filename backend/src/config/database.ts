import mongoose from 'mongoose'
import { logger } from '@/utils/logger'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/decentralized-identity'

export async function connectDatabase(): Promise<void> {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    }

    await mongoose.connect(MONGODB_URI, options)
    logger.info('Connected to MongoDB')
  } catch (error) {
    logger.error('MongoDB connection error:', error)
    throw error
  }
}

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB error:', error)
})

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected')
})

process.on('SIGINT', async () => {
  await mongoose.connection.close()
  logger.info('MongoDB connection closed through app termination')
  process.exit(0)
})
