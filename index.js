import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5002

app.use(cors())
app.use(express.json())

if (!process.env.MONGODB_URL) {
  console.error('MONGODB_URL is missing from .env file')
  process.exit(1)
}

const client = new MongoClient(process.env.MONGODB_URL)

let eventCollection

app.get('/', (req, res) => {
  res.send({
    success: true,
    message: 'Kindred server is running',
  })
})

app.post('/create-event', async (req, res) => {
  try {
    const { title, description, type, location, date, imageUrl, createdBy } =
      req.body

    if (
      typeof title !== 'string' ||
      typeof description !== 'string' ||
      typeof type !== 'string' ||
      typeof location !== 'string' ||
      typeof date !== 'string' ||
      typeof imageUrl !== 'string' ||
      typeof createdBy !== 'string'
    ) {
      return res.status(400).send({
        success: false,
        message: 'All fields are required',
      })
    }

    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    const cleanType = type.trim()
    const cleanLocation = location.trim()
    const cleanImageUrl = imageUrl.trim()
    const cleanCreatedBy = createdBy.trim().toLowerCase()

    if (
      !cleanTitle ||
      !cleanDescription ||
      !cleanType ||
      !cleanLocation ||
      !date.trim() ||
      !cleanImageUrl ||
      !cleanCreatedBy
    ) {
      return res.status(400).send({
        success: false,
        message: 'All fields are required',
      })
    }

    if (
      cleanTitle.length > 100 ||
      cleanDescription.length > 1500 ||
      cleanLocation.length > 150
    ) {
      return res.status(400).send({
        success: false,
        message: 'Some fields exceed the allowed length',
      })
    }

    const eventDate = new Date(date)

    if (Number.isNaN(eventDate.getTime())) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event date',
      })
    }

    const newEvent = {
      title: cleanTitle,
      description: cleanDescription,
      type: cleanType,
      location: cleanLocation,
      date: date.trim(),
      imageUrl: cleanImageUrl,
      createdBy: cleanCreatedBy,
      joined: [],
      createdAt: new Date(),
    }

    const result = await eventCollection.insertOne(newEvent)

    res.status(201).send({
      success: true,
      message: 'Event created successfully',
      event: {
        ...newEvent,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    console.error('Create event error:', error)

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

    res.send({
      success: true,
      events,
    })
  } catch (error) {
    console.error('Get events error:', error)

    res.status(500).send({
      success: false,
      message: 'Failed to get events',
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
    console.error('Get single event error:', error)

    res.status(500).send({
      success: false,
      message: 'Failed to get event',
    })
  }
})

app.put('/update-event/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const { title, description, type, location, date, imageUrl } = req.body

    const updateData = {}

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).send({
          success: false,
          message: 'Valid event title is required',
        })
      }

      if (title.trim().length > 100) {
        return res.status(400).send({
          success: false,
          message: 'Event title is too long',
        })
      }

      updateData.title = title.trim()
    }

    if (description !== undefined) {
      if (
        typeof description !== 'string' ||
        !description.trim() ||
        description.trim().length > 1500
      ) {
        return res.status(400).send({
          success: false,
          message: 'Valid event description is required',
        })
      }

      updateData.description = description.trim()
    }

    if (type !== undefined) {
      if (typeof type !== 'string' || !type.trim()) {
        return res.status(400).send({
          success: false,
          message: 'Valid event category is required',
        })
      }

      updateData.type = type.trim()
    }

    if (location !== undefined) {
      if (
        typeof location !== 'string' ||
        !location.trim() ||
        location.trim().length > 150
      ) {
        return res.status(400).send({
          success: false,
          message: 'Valid event location is required',
        })
      }

      updateData.location = location.trim()
    }

    if (date !== undefined) {
      if (typeof date !== 'string' || !date.trim()) {
        return res.status(400).send({
          success: false,
          message: 'Valid event date is required',
        })
      }

      const eventDate = new Date(date)

      if (Number.isNaN(eventDate.getTime())) {
        return res.status(400).send({
          success: false,
          message: 'Invalid event date',
        })
      }

      updateData.date = date.trim()
    }

    if (imageUrl !== undefined) {
      if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
        return res.status(400).send({
          success: false,
          message: 'Valid event image URL is required',
        })
      }

      updateData.imageUrl = imageUrl.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).send({
        success: false,
        message: 'No update data provided',
      })
    }

    updateData.updatedAt = new Date()

    const result = await eventCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData },
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
    console.error('Update event error:', error)

    res.status(500).send({
      success: false,
      message: 'Failed to update event',
    })
  }
})

app.patch('/join-event/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { email } = req.body

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event ID',
      })
    }

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).send({
        success: false,
        message: 'User email is required',
      })
    }

    const result = await eventCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $addToSet: {
          joined: email.trim().toLowerCase(),
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
      message: 'Successfully joined the event',
    })
  } catch (error) {
    console.error('Join event error:', error)

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
    console.error('Delete event error:', error)

    res.status(500).send({
      success: false,
      message: 'Failed to delete event',
    })
  }
})

async function connectDB() {
  try {
    await client.connect()

    const db = client.db('Social_Development1')
    eventCollection = db.collection('events')

    console.log('MongoDB connected successfully')

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}

connectDB()
