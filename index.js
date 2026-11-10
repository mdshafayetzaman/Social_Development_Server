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
    defaultId: 'kindred-default-013',
    title: 'Community Tree Plantation',
    description:
      'Join our community tree plantation campaign to create a greener and healthier environment.',
    type: 'Plantation',
    date: '2026-11-20',
    location: 'Dhaka, Bangladesh',
    imageUrl:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=85',
    organizer: 'Kindred Community',
    createdBy: 'kindred community',
    maxParticipants: 100,
  },
  {
    defaultId: 'kindred-default-014',
    title: 'Free Education Support',
    description:
      'Help underprivileged children receive quality education and learning resources.',
    type: 'Education',
    date: '2026-11-22',
    location: 'Mirpur, Dhaka',
    imageUrl:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop&q=85',
    organizer: 'Education Foundation',
    createdBy: 'education foundation',
    maxParticipants: 50,
  },
  {
    defaultId: 'kindred-default-015',
    title: 'Community Blood Donation',
    description:
      'Donate blood and help save lives through our community blood donation program.',
    type: 'Healthcare',
    date: '2026-11-24',
    location: 'Dhanmondi, Dhaka',
    imageUrl:
      'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=1200&auto=format&fit=crop&q=85',
    organizer: 'Health Care Team',
    createdBy: 'health care team',
    maxParticipants: 80,
  },
  {
    defaultId: 'kindred-default-016',
    title: 'Food Distribution Program',
    description:
      'Distribute nutritious food among families who need community support.',
    type: 'Donation',
    date: '2026-11-26',
    location: 'Uttara, Dhaka',
    imageUrl:
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&auto=format&fit=crop&q=85',
    organizer: 'Kindred Volunteers',
    createdBy: 'kindred volunteers',
    maxParticipants: 60,
  },
  {
    defaultId: 'kindred-default-017',
    title: 'Clean City Campaign',
    description:
      'Work together to clean public spaces and promote a cleaner city.',
    type: 'Cleanup',
    date: '2026-11-28',
    location: 'Gulshan, Dhaka',
    imageUrl:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15a?w=1200&auto=format&fit=crop&q=85',
    organizer: 'Green Bangladesh',
    createdBy: 'green bangladesh',
    maxParticipants: 70,
  },
  {
    defaultId: 'kindred-default-018',
    title: 'Free Health Awareness Camp',
    description:
      'Participate in a free health awareness campaign and learn about healthy living.',
    type: 'Healthcare',
    date: '2026-11-30',
    location: 'Mohammadpur, Dhaka',
    imageUrl:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=85',
    organizer: 'Health Awareness Team',
    createdBy: 'health awareness team',
    maxParticipants: 100,
  },
  {
    defaultId: 'kindred-default-019',
    title: 'Winter Clothes Distribution',
    description:
      'Support people in need by distributing warm clothes during the winter season.',
    type: 'Donation',
    date: '2026-12-02',
    location: 'Savar, Dhaka',
    imageUrl:
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&auto=format&fit=crop&q=85',
    organizer: 'Kindred Volunteers',
    createdBy: 'kindred volunteers',
    maxParticipants: 50,
  },
  {
    defaultId: 'kindred-default-020',
    title: 'Youth Skill Development Workshop',
    description:
      'Help young people develop useful skills through an interactive community workshop.',
    type: 'Education',
    date: '2026-12-05',
    location: 'Banani, Dhaka',
    imageUrl:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&auto=format&fit=crop&q=85',
    organizer: 'Youth Development Team',
    createdBy: 'youth development team',
    maxParticipants: 80,
  },
]

function isValidDate(dateString) {
  if (typeof dateString !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false

  const [year, month, day] = dateString.split('-').map(Number)
  const parsedDate = new Date(Date.UTC(year, month - 1, day))

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  )
}

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatEvent(event) {
  return {
    ...event,
    _id: event._id.toString(),
    category: event.category || event.type || '',
    type: event.type || event.category || '',
    image: event.image || event.imageUrl || '',
    imageUrl: event.imageUrl || event.image || '',
    organizer: event.organizer || event.createdBy || 'Community Member',
    maxParticipants: event.maxParticipants || 50,
    joined: event.joined || [],
    source: event.source || (event.defaultId ? 'default' : 'user'),
  }
}

async function seedDefaultEvents() {
  for (const event of defaultEvents) {
    const { defaultId, ...eventData } = event

    await eventCollection.updateOne(
      { defaultId },
      {
        $setOnInsert: {
          ...eventData,
          category: eventData.type,
          image: eventData.imageUrl,
          defaultId,
          source: 'default',
          joined: [],
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )
  }

  console.log('Default events seeded successfully')
}

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kindred Events API is running',
  })
})

app.post('/create-event', async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      date,
      location,
      imageUrl,
      createdBy,
      organizer,
      maxParticipants,
    } = req.body

    if (
      typeof title !== 'string' ||
      typeof description !== 'string' ||
      typeof type !== 'string' ||
      typeof date !== 'string' ||
      typeof location !== 'string' ||
      typeof imageUrl !== 'string' ||
      typeof createdBy !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required event information.',
      })
    }

    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    const cleanType = type.trim()
    const cleanDate = date.trim()
    const cleanLocation = location.trim()
    const cleanImageUrl = imageUrl.trim()
    const cleanEmail = createdBy.trim().toLowerCase()

    const cleanOrganizer =
      typeof organizer === 'string' && organizer.trim()
        ? organizer.trim()
        : cleanEmail

    if (
      !cleanTitle ||
      !cleanDescription ||
      !cleanType ||
      !cleanDate ||
      !cleanLocation ||
      !cleanImageUrl ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields correctly.',
      })
    }

    if (
      cleanTitle.length > 100 ||
      cleanDescription.length > 1500 ||
      cleanType.length > 100 ||
      cleanLocation.length > 150 ||
      cleanImageUrl.length > 2000 ||
      cleanOrganizer.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Event information exceeds the allowed limit.',
      })
    }

    if (!isValidDate(cleanDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event date.',
      })
    }

    if (cleanDate <= getTodayDate()) {
      return res.status(400).json({
        success: false,
        message: 'Please select a future event date.',
      })
    }

    try {
      const parsedUrl = new URL(cleanImageUrl)

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL')
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid image URL.',
      })
    }

    const participants = Number(maxParticipants) || 50

    if (!Number.isInteger(participants) || participants < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid maximum participants.',
      })
    }

    const newEvent = {
      title: cleanTitle,
      description: cleanDescription,
      category: cleanType,
      type: cleanType,
      date: cleanDate,
      location: cleanLocation,
      image: cleanImageUrl,
      imageUrl: cleanImageUrl,
      organizer: cleanOrganizer,
      createdBy: cleanEmail,
      maxParticipants: participants,
      source: 'user',
      joined: [],
      createdAt: new Date(),
    }

    const result = await eventCollection.insertOne(newEvent)

    res.status(201).json({
      success: true,
      message: 'Your event has been published successfully!',
      event: {
        ...newEvent,
        _id: result.insertedId.toString(),
      },
    })
  } catch (error) {
    console.error('Create event error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to create event.',
    })
  }
})

app.get('/events', async (req, res) => {
  try {
    const events = await eventCollection
      .find({})
      .sort({ date: 1, createdAt: -1 })
      .toArray()

    res.status(200).json({
      success: true,
      totalEvents: events.length,
      events: events.map(formatEvent),
    })
  } catch (error) {
    console.error('Get all events error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch events.',
    })
  }
})

app.get('/events/user', async (req, res) => {
  try {
    const events = await eventCollection
      .find({ source: 'user' })
      .sort({ date: 1, createdAt: -1 })
      .toArray()

    res.status(200).json({
      success: true,
      totalEvents: events.length,
      events: events.map(formatEvent),
    })
  } catch (error) {
    console.error('Get user events error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch user events.',
    })
  }
})

app.get('/joined-events', async (req, res) => {
  try {
    const email = req.query.email

    if (
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      })
    }

    const cleanEmail = email.trim().toLowerCase()

    const events = await eventCollection
      .find({ joined: cleanEmail })
      .sort({ date: 1 })
      .toArray()

    res.status(200).json({
      success: true,
      totalEvents: events.length,
      events: events.map(formatEvent),
    })
  } catch (error) {
    console.error('Get joined events error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch joined events.',
    })
  }
})

app.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      })
    }

    const event = await eventCollection.findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      })
    }

    res.status(200).json({
      success: true,
      event: formatEvent(event),
    })
  } catch (error) {
    console.error('Get single event error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch event.',
    })
  }
})

app.put('/update-event/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      })
    }

    const {
      title,
      description,
      category,
      type,
      date,
      location,
      image,
      imageUrl,
      organizer,
      createdBy,
      maxParticipants,
    } = req.body

    const updatedData = {}

    if (title !== undefined) {
      if (typeof title !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid title.',
        })
      }
      updatedData.title = title.trim()
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid description.',
        })
      }
      updatedData.description = description.trim()
    }

    if (category !== undefined || type !== undefined) {
      const cleanType = category ?? type

      if (typeof cleanType !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid event category.',
        })
      }

      updatedData.category = cleanType.trim()
      updatedData.type = cleanType.trim()
    }

    if (date !== undefined) {
      if (typeof date !== 'string' || !isValidDate(date.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event date.',
        })
      }

      updatedData.date = date.trim()
    }

    if (location !== undefined) {
      if (typeof location !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid location.',
        })
      }

      updatedData.location = location.trim()
    }

    if (image !== undefined || imageUrl !== undefined) {
      const cleanImage = image ?? imageUrl

      if (typeof cleanImage !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid image URL.',
        })
      }

      try {
        const parsedUrl = new URL(cleanImage.trim())

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid URL')
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid image URL.',
        })
      }

      updatedData.image = cleanImage.trim()
      updatedData.imageUrl = cleanImage.trim()
    }

    if (organizer !== undefined) {
      if (typeof organizer !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid organizer.',
        })
      }

      updatedData.organizer = organizer.trim()
    }

    if (maxParticipants !== undefined) {
      const participants = Number(maxParticipants)

      if (!Number.isInteger(participants) || participants < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid maxParticipants.',
        })
      }

      updatedData.maxParticipants = participants
    }

    const limits = {
      title: 100,
      description: 1500,
      category: 100,
      location: 150,
      image: 2000,
      organizer: 100,
    }

    for (const [field, maxLength] of Object.entries(limits)) {
      if (
        updatedData[field] !== undefined &&
        (!updatedData[field] || updatedData[field].length > maxLength)
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}.`,
        })
      }
    }

    if (!Object.keys(updatedData).length) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided.',
      })
    }

    updatedData.updatedAt = new Date()

    const result = await eventCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData },
    )

    if (!result.matchedCount) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      })
    }

    const updatedEvent = await eventCollection.findOne({
      _id: new ObjectId(id),
    })

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: formatEvent(updatedEvent),
    })
  } catch (error) {
    console.error('Update event error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to update event.',
    })
  }
})

app.patch('/join-event/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { email } = req.body

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      })
    }

    if (
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      })
    }

    const cleanEmail = email.trim().toLowerCase()

    const result = await eventCollection.updateOne(
      {
        _id: new ObjectId(id),
        joined: { $ne: cleanEmail },
        $expr: {
          $lt: [
            { $size: { $ifNull: ['$joined', []] } },
            { $ifNull: ['$maxParticipants', 50] },
          ],
        },
      },
      {
        $addToSet: {
          joined: cleanEmail,
        },
      },
    )

    if (!result.matchedCount) {
      const event = await eventCollection.findOne({
        _id: new ObjectId(id),
      })

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found.',
        })
      }

      const joined = event.joined || []

      return res.status(409).json({
        success: false,
        message: joined.includes(cleanEmail)
          ? 'You have already joined this event.'
          : 'Event is full.',
        joined,
        totalJoined: joined.length,
      })
    }

    const updatedEvent = await eventCollection.findOne({
      _id: new ObjectId(id),
    })

    const joined = updatedEvent?.joined || []

    res.status(200).json({
      success: true,
      message: 'Successfully joined the event.',
      joined,
      totalJoined: joined.length,
      maxParticipants: updatedEvent.maxParticipants || 50,
    })
  } catch (error) {
    console.error('Join event error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to join event.',
    })
  }
})

app.delete('/delete-event/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      })
    }

    const result = await eventCollection.deleteOne({
      _id: new ObjectId(id),
    })

    if (!result.deletedCount) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully.',
    })
  } catch (error) {
    console.error('Delete event error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to delete event.',
    })
  }
})

async function startServer() {
  try {
    await client.connect()

    const database = client.db('Social_Development1')
    eventCollection = database.collection('events')

    await seedDefaultEvents()

    await eventCollection.updateMany(
      {
        defaultId: { $exists: false },
        source: { $exists: false },
      },
      {
        $set: {
          source: 'user',
        },
      },
    )

    console.log('Existing user events updated successfully')

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}

startServer()
