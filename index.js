import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5002

app.use(cors())
app.use(express.json())

const client = new MongoClient(process.env.MONGODB_URL)

let eventCollection

async function connectDB() {
  try {
    await client.connect()

    const db = client.db('Social_Development1')
    eventCollection = db.collection('events')

    console.log('MongoDB Connected Successfully')

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB Connection Failed:', error)
  }
}

app.get('/', (req, res) => {
  res.send({
    success: true,
    message: 'Kindred Server is Running',
  })
})

app.post('/create-event', async (req, res) => {
  try {
    const { title, description, type, location, date, imageUrl, createdBy } =
      req.body

    if (
      !title ||
      !description ||
      !type ||
      !location ||
      !date ||
      !imageUrl ||
      !createdBy
    ) {
      return res.status(400).send({
        success: false,
        message: 'All fields are required',
      })
    }

    const newEvent = {
      title,
      description,
      type,
      location,
      date,
      imageUrl,
      createdBy,
      joined: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await eventCollection.insertOne(newEvent)

    res.status(201).send({
      success: true,
      message: 'Event created successfully',
      insertedId: result.insertedId,
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to create event',
    })
  }
})

app.get('/events', async (req, res) => {
  try {
    const events = await eventCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray()

    res.send(events)
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to fetch events',
    })
  }
})

app.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const event = await eventCollection.findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return res.status(404).send({
        success: false,
        message: 'Event not found',
      })
    }

    res.send({
      success: true,
      event,
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to fetch event',
    })
  }
})

app.put('/update-event/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { title, description, type, location, date, imageUrl } = req.body

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event ID',
      })
    }

    if (!title || !description || !type || !location || !date || !imageUrl) {
      return res.status(400).send({
        success: false,
        message: 'All fields are required',
      })
    }

    const result = await eventCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          title,
          description,
          type,
          location,
          date,
          imageUrl,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return res.status(404).send({
        success: false,
        message: 'Event not found',
      })
    }

    res.send({
      success: true,
      message: 'Event updated successfully',
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to update event',
    })
  }
})

app.patch('/join-event/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { userId } = req.body

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event ID',
      })
    }

    if (!userId) {
      return res.status(400).send({
        success: false,
        message: 'User ID is required',
      })
    }

    const result = await eventCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $addToSet: {
          joined: userId,
        },
      },
    )

    if (result.matchedCount === 0) {
      return res.status(404).send({
        success: false,
        message: 'Event not found',
      })
    }

    res.send({
      success: true,
      message: 'Joined event successfully',
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to join event',
    })
  }
})

app.delete('/delete-event/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const result = await eventCollection.deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return res.status(404).send({
        success: false,
        message: 'Event not found',
      })
    }

    res.send({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to delete event',
    })
  }
})

connectDB()
