import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'
import { createRemoteJWKSet, jwtVerify } from 'jose'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5002

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL
const MONGODB_URL = process.env.MONGODB_URL

if (!MONGODB_URL || !BETTER_AUTH_URL) {
  console.error('MONGODB_URL and BETTER_AUTH_URL are required.')
  process.exit(1)
}

app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }),
)

app.use(express.json({ limit: '1mb' }))

const client = new MongoClient(MONGODB_URL)
const JWKS = createRemoteJWKSet(new URL('/api/auth/jwks', BETTER_AUTH_URL))

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
    createdBy: 'Health Awareness Team',
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

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function getTodayDate() {
  const today = new Date()

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function isValidImageUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
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

async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Please login to continue.',
      })
    }

    const token = authHeader.slice(7).trim()

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'JWT token is missing.',
      })
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: BETTER_AUTH_URL,
      audience: BETTER_AUTH_URL,
    })

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid JWT payload.',
      })
    }

    req.user = {
      id: payload.sub,
      email: normalizeEmail(payload.email),
      name:
        typeof payload.name === 'string' && payload.name.trim()
          ? payload.name.trim()
          : payload.email.trim(),
    }

    console.log('Authenticated user:', req.user.email)

    next()
  } catch (error) {
    console.error('JWT verification failed:', error.message)

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired JWT token.',
    })
  }
}

function isEventOwner(event, user) {
  if (!event || !user) return false

  if (event.defaultId || event.source === 'default') {
    return false
  }

  const eventEmail = normalizeEmail(event.createdBy)
  const userEmail = normalizeEmail(user.email)

  const emailMatches = Boolean(eventEmail) && eventEmail === userEmail

  const idMatches =
    Boolean(event.createdById) &&
    Boolean(user.id) &&
    String(event.createdById) === String(user.id)

  return event.source === 'user' && (emailMatches || idMatches)
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

app.post('/create-event', verifyAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      date,
      location,
      imageUrl,
      organizer,
      maxParticipants,
    } = req.body

    const cleanTitle = typeof title === 'string' ? title.trim() : ''
    const cleanDescription =
      typeof description === 'string' ? description.trim() : ''
    const cleanType = typeof type === 'string' ? type.trim() : ''
    const cleanDate = typeof date === 'string' ? date.trim() : ''
    const cleanLocation = typeof location === 'string' ? location.trim() : ''
    const cleanImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : ''

    if (
      !cleanTitle ||
      !cleanDescription ||
      !cleanType ||
      !cleanDate ||
      !cleanLocation ||
      !cleanImageUrl
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.',
      })
    }

    if (
      cleanTitle.length > 100 ||
      cleanDescription.length > 1500 ||
      cleanType.length > 100 ||
      cleanLocation.length > 150 ||
      cleanImageUrl.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Event information exceeds the allowed limit.',
      })
    }

    if (!isValidDate(cleanDate) || cleanDate <= getTodayDate()) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid future event date.',
      })
    }

    if (!isValidImageUrl(cleanImageUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid image URL.',
      })
    }

    const participants = Number(maxParticipants ?? 50)

    if (
      !Number.isInteger(participants) ||
      participants < 1 ||
      participants > 500
    ) {
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
      organizer:
        typeof organizer === 'string' && organizer.trim()
          ? organizer.trim()
          : req.user.name,
      createdBy: req.user.email,
      createdById: req.user.id,
      maxParticipants: participants,
      source: 'user',
      joined: [],
      createdAt: new Date(),
    }

    const result = await eventCollection.insertOne(newEvent)

    return res.status(201).json({
      success: true,
      message: 'Your event has been published successfully!',
      event: {
        ...newEvent,
        _id: result.insertedId.toString(),
      },
    })
  } catch (error) {
    console.error('Create event error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to create event.',
    })
  }
})

app.get('/events', async (req, res) => {
  try {
    const events = await eventCollection
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .toArray()

    return res.status(200).json({
      success: true,
      totalEvents: events.length,
      events: events.map(formatEvent),
    })
  } catch (error) {
    console.error('Get all events error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch events.',
    })
  }
})

app.get('/events/user', verifyAuth, async (req, res) => {
  try {
    const events = await eventCollection
      .find({
        source: 'user',
        $or: [{ createdBy: req.user.email }, { createdById: req.user.id }],
      })
      .sort({ createdAt: -1, _id: -1 })
      .toArray()

    return res.status(200).json({
      success: true,
      totalEvents: events.length,
      events: events.map(formatEvent),
    })
  } catch (error) {
    console.error('Get user events error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user events.',
    })
  }
})

app.get('/joined-events', verifyAuth, async (req, res) => {
  try {
    const events = await eventCollection
      .find({ joined: req.user.email })
      .sort({ createdAt: -1, _id: -1 })
      .toArray()

    return res.status(200).json({
      success: true,
      totalEvents: events.length,
      events: events.map(formatEvent),
    })
  } catch (error) {
    console.error('Get joined events error:', error)

    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      event: formatEvent(event),
    })
  } catch (error) {
    console.error('Get single event error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch event.',
    })
  }
})

app.put('/update-event/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      })
    }

    const existingEvent = await eventCollection.findOne({
      _id: new ObjectId(id),
    })

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      })
    }

    if (!isEventOwner(existingEvent, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this event.',
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
      maxParticipants,
    } = req.body

    const updatedData = {}

    if (title !== undefined) {
      if (
        typeof title !== 'string' ||
        !title.trim() ||
        title.trim().length > 100
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid title.' })
      }
      updatedData.title = title.trim()
    }

    if (description !== undefined) {
      if (
        typeof description !== 'string' ||
        !description.trim() ||
        description.trim().length > 1500
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid description.' })
      }
      updatedData.description = description.trim()
    }

    if (category !== undefined || type !== undefined) {
      const cleanType = category ?? type

      if (
        typeof cleanType !== 'string' ||
        !cleanType.trim() ||
        cleanType.trim().length > 100
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid event category.' })
      }

      updatedData.category = cleanType.trim()
      updatedData.type = cleanType.trim()
    }

    if (date !== undefined) {
      if (
        typeof date !== 'string' ||
        !isValidDate(date.trim()) ||
        date.trim() <= getTodayDate()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Please select a valid future event date.',
          })
      }
      updatedData.date = date.trim()
    }

    if (location !== undefined) {
      if (
        typeof location !== 'string' ||
        !location.trim() ||
        location.trim().length > 150
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid location.' })
      }
      updatedData.location = location.trim()
    }

    if (image !== undefined || imageUrl !== undefined) {
      const cleanImage = image ?? imageUrl

      if (
        typeof cleanImage !== 'string' ||
        !isValidImageUrl(cleanImage.trim()) ||
        cleanImage.trim().length > 2000
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Please provide a valid image URL.',
          })
      }

      updatedData.image = cleanImage.trim()
      updatedData.imageUrl = cleanImage.trim()
    }

    if (organizer !== undefined) {
      if (
        typeof organizer !== 'string' ||
        !organizer.trim() ||
        organizer.trim().length > 100
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid organizer.' })
      }
      updatedData.organizer = organizer.trim()
    }

    if (maxParticipants !== undefined) {
      const participants = Number(maxParticipants)

      if (
        !Number.isInteger(participants) ||
        participants < 1 ||
        participants > 500
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid maximum participants.' })
      }

      updatedData.maxParticipants = participants
    }

    if (!Object.keys(updatedData).length) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided.',
      })
    }

    updatedData.updatedAt = new Date()

    const result = await eventCollection.updateOne(
      {
        _id: new ObjectId(id),
        source: 'user',
        $or: [{ createdBy: req.user.email }, { createdById: req.user.id }],
      },
      { $set: updatedData },
    )

    if (!result.matchedCount) {
      return res.status(403).json({
        success: false,
        message: 'Event not found or you are not allowed to update it.',
      })
    }

    const updatedEvent = await eventCollection.findOne({
      _id: new ObjectId(id),
    })

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: formatEvent(updatedEvent),
    })
  } catch (error) {
    console.error('Update event error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to update event.',
    })
  }
})

app.patch('/join-event/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID.',
      })
    }

    const email = req.user.email

    const result = await eventCollection.updateOne(
      {
        _id: new ObjectId(id),
        joined: { $ne: email },
        $expr: {
          $lt: [
            { $size: { $ifNull: ['$joined', []] } },
            { $ifNull: ['$maxParticipants', 50] },
          ],
        },
      },
      { $addToSet: { joined: email } },
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
        message: joined.includes(email)
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

    return res.status(200).json({
      success: true,
      message: 'Successfully joined the event.',
      joined,
      totalJoined: joined.length,
      maxParticipants: updatedEvent.maxParticipants || 50,
    })
  } catch (error) {
    console.error('Join event error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to join event.',
    })
  }
})

app.delete('/delete-event/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params

    console.log('DELETE REQUEST RECEIVED:', id)

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

    console.log('DELETE DEBUG:', {
      eventId: id,
      eventCreatedBy: event.createdBy,
      eventCreatedById: event.createdById,
      eventSource: event.source,
      eventDefaultId: event.defaultId,
      loggedInEmail: req.user.email,
      loggedInId: req.user.id,
      emailMatches:
        normalizeEmail(event.createdBy) === normalizeEmail(req.user.email),
      idMatches: String(event.createdById || '') === String(req.user.id || ''),
    })

    if (!isEventOwner(event, req.user)) {
      console.log('DELETE OWNERSHIP FAILED:', id)

      return res.status(403).json({
        success: false,
        message: 'You are not allowed to delete this event.',
      })
    }

    const result = await eventCollection.deleteOne({
      _id: new ObjectId(id),
      source: 'user',
      $or: [{ createdBy: req.user.email }, { createdById: req.user.id }],
    })

    if (result.deletedCount !== 1) {
      return res.status(404).json({
        success: false,
        message: 'Event could not be deleted.',
      })
    }

    console.log('EVENT DELETED SUCCESSFULLY:', id)

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully.',
      deletedId: id,
    })
  } catch (error) {
    console.error('Delete event error:', error)

    return res.status(500).json({
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
        $set: { source: 'user' },
      },
    )

    await eventCollection.updateMany({ createdAt: { $exists: false } }, [
      {
        $set: {
          createdAt: {
            $toDate: { $toLong: '$_id' },
          },
        },
      },
    ])

    console.log('Existing events timestamps updated successfully')

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}

startServer()
export default app
