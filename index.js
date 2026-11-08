import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = 5002

app.use(cors())
app.use(express.json())



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
