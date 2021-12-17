import express, { query } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import listEndpoints from 'express-list-endpoints';
import topMusicData from './data/top-music.json';

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/project-mongo';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Spotify Songs API',
      version: '1.0.0',
      description:
        'A mongo-backed API. The dataset consists of the top 100 streamed songs of all time on Spotify.',
      contact: {
        name: 'Isabel González',
        email: 'ic.gonzalez35@hotmail.com',
        url: 'https://github.com/isomoth/',
      },
    },
  },
  apis: ['./server.js'], // files containing annotations as above
};
const swaggerDocs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Our own middleware that checks if the database is connected before going forward to our endpoints
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next();
  } else {
    res.status(503).json({ error: 'Service unavailable' });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Type /endpoints in the URL bar to start.');
});

// Send list of all endpoints

/**
 * @swagger
 * /endpoints:
 *   get:
 *     summary: List all API endpoints
 *     tags:
 *      - Endpoints
 *     responses:
 *       200:
 *         description: Successful response.
 */
app.get('/endpoints', (req, res) => {
  res.send(listEndpoints(app));
});

// Seed the database
const Track = mongoose.model('Track', {
  id: Number,
  trackName: String,
  artistName: String,
  genre: String,
  year: Number,
  bpm: Number,
  energy: Number,
  danceability: Number,
  loudness: Number,
  liveness: Number,
  valence: Number,
  length: Number,
  acousticness: Number,
  speechiness: Number,
  popularity: Number,
});

// Avoid duplicates upon restarting
if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    await Track.deleteMany({});

    topMusicData.forEach((item) => {
      const newTrack = new Track(item);
      newTrack.save();
    });
  };
  seedDatabase();
}

// Get all tracks. Optional queries: Filter by trackName, artistName, genre, year, bpm...
// Examples: /tracks/?year=2016
// Examples: /tracks/?bpm=80

/**
 * @swagger
 /tracks:
 *   get:
 *     summary: List all tracks, optional filters by query parameters
 *     parameters:
 *      - name: trackName
 *        in: query
 *        required: false
 *        format: string
 *      - name: artistName
 *        in: query
 *        required: false
 *        format: string
 *      - name: genre
 *        in: query
 *        required: false
 *        format: string
 *      - name: year
 *        in: query
 *        required: false
 *        format: string
 *     tags: 
 *      - Tracks
 *     responses:
 *       200:
 *         description: Successful response.
 */
app.get('/tracks/', async (req, res) => {
  let tracks = await Track.find(req.query);
  if (tracks) {
    // Get tracks for your party (i.e. danceability based on the number you specify).
    // Test with different values. For example, choose 70 if you're looking for more energetic dances.
    // Example: /tracks/?danceability=60
    if (req.query.danceability) {
      const songsByDanceability = await Track.find().gt(
        'danceability',
        req.query.danceability,
      );
      tracks = songsByDanceability;
    }
    res.json(tracks);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Get track by ID

/**
 * @swagger
 * /tracks/id/{id}:
 *   get:
 *     summary: Get tracks by id
 *     parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        description: Get an id from the "tracks" query above. Click on "Try it out" and then fill in the song id.
 *        format: integer
 *     tags:
 *      - Single result
 *     responses:
 *       200:
 *         description: Successful response.
 */
app.get('/tracks/id/:id', async (req, res) => {
  try {
    const trackById = await Track.findById(req.params.id);
    if (trackById) {
      res.json(trackById);
    } else {
      res.status(404).json({ error: 'Track not found' });
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid Id' });
  }
});

// Get all songs by Billie Eilish

/**
 * @swagger
 * /tracks/artist/billie_eilish:
 *   get:
 *     summary: Get all tracks by Billie Eilish
 *     tags:
 *      - Artist Collection
 *     responses:
 *       200:
 *         description: Successful response.
 */
app.get('/tracks/artist/billie_eilish', (req, res) => {
  Track.find({ artistName: 'Billie Eilish' }, (error, data) => {
    if (error) {
      res.status(404).json({ error: 'Not found' });
    } else {
      res.send(data);
    }
  });
});

// Get tracks from the pop genre

/**
 * @swagger
 * /tracks/genre/pop:
 *   get:
 *     summary: Get all tracks within the pop genre
 *     tags:
 *      - Genre Collection
 *     responses:
 *       200:
 *         description: Successful response.
 */
app.get('/tracks/genre/pop', (req, res) => {
  Track.find({ genre: 'pop' }, (error, data) => {
    if (error) {
      res.status(404).json({ error: 'Not found' });
    } else {
      res.send(data);
    }
  });
});

// Get tracks for your workout, i.e. energy > 80. No parameters needed.

/**
 * @swagger
 * /tracks/playlists/workout/:
 *   get:
 *     summary: Get all tracks with energy > 80
 *     tags:
 *      - Playlists
 *     responses:
 *       200:
 *         description: Successful response.
 */
app.get('/tracks/playlists/workout/', (req, res) => {
  Track.find({ energy: { $gte: 80 } }, (error, tracks) => {
    if (error) {
      res.status(404).json({ error: 'Not found' });
    } else {
      res.send(tracks);
    }
  });
});

// Get calm tracks for a cozy time at home, i.e. energy < 20. No parameters needed.

/**
 * @swagger
 * /tracks/playlists/calm/:
 *   get:
 *     summary: Get all tracks with energy < 20
 *     tags:
 *      - Playlists
 *     responses:
 *       200:
 *         description: Successful response.
 */
app.get('/tracks/playlists/calm/', (req, res) => {
  Track.find({ energy: { $lte: 20 } }, (error, tracks) => {
    if (error) {
      res.status(404).json({ error: 'Not found' });
    } else {
      res.send(tracks);
    }
  });
});

// Start the server
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on http://localhost:${port}`);
});
