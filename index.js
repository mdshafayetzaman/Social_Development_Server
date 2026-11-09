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

const defaultEvents = [
  {
    defaultId: 'kindred-default-001',
    title: 'Community Tree Plantation',
    description:
      'Join our community tree plantation campaign and help create a greener and healthier environment for everyone.',
    type: 'Environment',
    location: 'Savar, Dhaka',
    date: '2027-01-15',
    imageUrl:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000',
    createdBy: 'kindred community',
    joined: [],
    source: 'default',
  },
  {
    defaultId: 'kindred-default-002',
    title: 'Free Blood Donation Camp',
    description:
      'Become a lifesaver by participating in our blood donation campaign. Every drop of blood can save a life.',
    type: 'Health',
    location: 'Dhanmondi, Dhaka',
    date: '2027-01-20',
    imageUrl:
      'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=1000',
    createdBy: 'kindred community',
    joined: [],
    source: 'default',
  },
  {
    defaultId: 'kindred-default-003',
    title: 'Winter Clothes Distribution',
    description:
      'Join hands with volunteers to distribute warm clothes among underprivileged families.',
    type: 'Charity',
    location: 'Mirpur, Dhaka',
    date: '2027-01-25',
    imageUrl:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000',
    createdBy: 'kindred community',
    joined: [],
    source: 'default',
  },
  {
    defaultId: 'kindred-default-004',
    title: 'Free Coding Workshop',
    description:
      'Learn web development, programming fundamentals and modern technology with experienced mentors.',
    type: 'Education',
    location: 'Uttara, Dhaka',
    date: '2027-02-05',
    imageUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000',
    createdBy: 'kindred community',
    joined: [],
    source: 'default',
  },
  {
    defaultId: 'kindred-default-005',
    title: 'Community Food Distribution',
    description:
      'Help us distribute nutritious food to families who need support in our local community.',
    type: 'Charity',
    location: 'Mohammadpur, Dhaka',
    date: '2027-02-12',
    imageUrl:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1000',
    createdBy: 'kindred community',
    joined: [],
    source: 'default',
  },
  {
    defaultId: 'kindred-default-006',
    title: 'Neighborhood Clean-up Campaign',
    description:
      'Work together with local volunteers to clean public spaces and make our neighborhood beautiful.',
    type: 'Environment',
    location: 'Savar, Dhaka',
    date: '2027-02-20',
    imageUrl:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1000',
    createdBy: 'kindred community',
    joined: [],
    source: 'default',
  },
]

async function seedDefaultEvents() {
  try {
    for (const event of defaultEvents) {
      const { defaultId, ...eventData } = event

      await eventCollection.updateOne(
        { defaultId },
        {
          $setOnInsert: {
            ...eventData,
            defaultId,
            createdAt: new Date(),
          },
        },
        { upsert: true },
      )
    }

    console.log('Default events added successfully')
  } catch (error) {
    console.error('Default events seeding error:', error)
    throw error
  }
}

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
      source: 'user',
      createdAt: new Date(),
    }

    const result = await eventCollection.insertOne(newEvent)

    res.status(201).send({
      success: true,
      message: 'Event created successfully',
      event: {
        ...newEvent,
        _id: result.insertedId.toString(),
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
      .sort({ date: 1, createdAt: -1 })
      .toArray()

    res.send({
      success: true,
      totalEvents: events.length,
      events: events.map((event) => ({
        ...event,
        _id: event._id.toString(),
        joined: event.joined || [],
        source: event.source || 'user',
      })),
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
      event: {
        ...event,
        _id: event._id.toString(),
        joined: event.joined || [],
        source: event.source || 'user',
      },
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

    if (
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).send({
        success: false,
        message: 'Please provide a valid email address',
      })
    }

    const cleanEmail = email.trim().toLowerCase()

    const result = await eventCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $addToSet: {
          joined: cleanEmail,
        },
      },
    )

    if (result.matchedCount === 0) {
      return res.status(404).send({
        success: false,
        message: 'Event not found',
      })
    }

    const updatedEvent = await eventCollection.findOne({
      _id: new ObjectId(id),
    })

    const joined = updatedEvent?.joined || []

    if (result.modifiedCount === 0) {
      return res.status(409).send({
        success: false,
        message: 'You have already joined this event',
        joined,
        totalJoined: joined.length,
      })
    }

    res.send({
      success: true,
      message: 'Successfully joined the event',
      joined,
      totalJoined: joined.length,
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

    await seedDefaultEvents()

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
