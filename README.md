# Top 100 Music Tracks - A MongoDB REST API

This is my second API project. I learned to "translate" Express queries from a previous project to Mongoose. The dataset consists of the top 100 streamed songs of all time on Spotify. The source of the data was Kaggle.com, which in turn retrieved it from http://organizeyourmusic.playlistmachinery.com/.

## Features

- 8 different routes using Mongoose methods like find, findById, gt and lt.
- Endpoints that return a collection of results: Get all tracks, filter pop tracks, filter tracks by workout or calm moods.
- Endpoints that return a single result: Get track by ID and query parameters: trackName, artistName, genre, year, bpm.
- Error handling by returning 404 status codes when the item is not found.

## Production process

- This is an enhancement of my Express API project: https://github.com/isomoth/project-express-api
- The first route was /tracks. First I console.logged the data and then implemented it as the API response.
- Then I proceeded to do the routes that return the collections, and finally the single results (including the ones with query params).
  I implemented filters that simulates a rudimentary playlist mechanism. One of the routes displays tracks that are suitable for a party by filtering by the danceability parameter. The other two routes filter tracks through the energy parameter to present a collection of workout songs and another with a calm mood.
- Last but not least, I implemented error handling on all routes (this is an improvement from the Express API project, where not all of them had it).
- Another enhancement from last week was the implementation of pagination (with the limit method).

## Challenges and lessons learned

- The most difficult part about this project was the deployment. Connecting Heroku with MongoDB Cloud Atlas took a while to figure out. But the app's documentation combined with a detailed inspection of Heroku logs helped a lot.

## View it live

https://top-tracks-isabel-mongodb.herokuapp.com/
