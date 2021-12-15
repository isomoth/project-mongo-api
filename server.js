import express, { query } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import listEndpoints from 'express-list-endpoints';
import topMusicData from './data/top-music.json';

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/project-mongo';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

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

app.get('/tracks/', async (req, res) => {
  let tracks = await Track.find(req.query).limit(10);
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
