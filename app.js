const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

const path = require('path')
const dbPath = path.join(__dirname, 'moviesData.db')

let db = null
const initializationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server Running at http://localhost/3000/')
    })
  } catch (e) {
    console.log(`Db Error ${e.message}`)
  }
}

initializationDbAndServer()
app.use(express.json())

//used for getting only a movie name
const convertDbObjectToResponseObjectForOnlyMovieName = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

//used for converting a movie details
const convertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

// used for converting a director

const convertDbObjectToResponseObjectForDirector = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

// get list of movies names

app.get('/movies/', async (request, response) => {
  const getMoviesList = `SELECT * FROM movie;`
  const movieArray = await db.all(getMoviesList)
  response.send(
    movieArray.map(eachMovie =>
      convertDbObjectToResponseObjectForOnlyMovieName(eachMovie),
    ),
  )
})

// post new movie

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const postQuery = `INSERT INTO movie(director_id,movie_name,lead_actor) VALUES(${directorId},'${movieName}','${leadActor}');`
  const dbResponse = await db.run(postQuery)
  const movieId = dbResponse.lastID
  response.send('Movie Successfully Added')
})

// get a single movie

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id = ${movieId};`
  const movie = await db.get(getMovieQuery)
  response.send(convertDbObjectToResponseObject(movie))
})

// update a exixting movie

app.put('/movies/:movieId/', async (request, response) => {
  const movieDetails = request.body
  const {movieId} = request.params

  const {directorId, movieName, leadActor} = movieDetails
  const putMovieQuery = `UPDATE movie SET director_id = ${directorId},movie_name = '${movieName}', lead_actor = '${leadActor}' WHERE movie_id = ${movieId};`
  await db.run(putMovieQuery)
  response.send('Movie Details Updated')
})

// delete an existing movie

app.delete('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const deleteMovie = `DELETE FROM movie WHERE movie_id = ${movieId}`
  await db.run(deleteMovie)
  response.send('Movie Removed')
})

// get list of directors

app.get('/directors/', async (request, response) => {
  const directorListQuery = `SELECT * FROM director;`
  const dbResponse = await db.all(directorListQuery)
  response.send(
    dbResponse.map(eachDirector =>
      convertDbObjectToResponseObjectForDirector(eachDirector),
    ),
  )
})

// get movies of specific director
app.get('/directors/:directorId/movies', async (request, response) => {
  const {directorId} = request.params
  const getSpecificDirectorMovieQuery = `SELECT movie_name FROM movie WHERE director_id = ${directorId}`
  const dbResponse = await db.all(getSpecificDirectorMovieQuery)
  response.send(
    dbResponse.map(eachDirectorMovies =>
      convertDbObjectToResponseObject(eachDirectorMovies),
    ),
  )
})

module.exports = app
