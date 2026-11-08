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

let collection

async function connectToMongoDB() {
  try {
    await client.connect()

    console.log('You successfully connected to MongoDB!')

    const db = client.db('Social_Development1')
    collection = db.collection('users')

    console.log('Database connected: Social_Development1')
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

app.post('/create-event', async (req, res) => {
  try {
    console.log('API called')

    const eventData = req.body

    const result = await collection.insertOne({
      ...eventData,
      createdAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      insertedId: result.insertedId,
    })
  } catch (error) {
    console.error('Event creation failed:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to create event',
    })
  }
})

async function startServer() {
  await connectToMongoDB()

  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

startServer()
