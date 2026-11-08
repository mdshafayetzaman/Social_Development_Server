import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = 5002

app.use(cors())
app.use(express.json())

const client = new MongoClient(process.env.MONGODB_URL)

async function connectToMongoDB() {
  try {
    await client.connect()


    console.log('You successfully connected to MongoDB!')
    console.log('Database connected: Social_Development')
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/test', (req, res) => {
  res.send('MongoDB API is working!')
})

async function startServer() {
  await connectToMongoDB()

  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

startServer()
