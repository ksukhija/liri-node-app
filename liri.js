//Get the Packages/Modules used in this exercise

// dotenv gets the environment variable from a .env file to  process.env 
// thus helping in keeping the configuration settings seperate from the code
require('dotenv').config();  

//Spotify node API
var Spotify = require('node-spotify-api');

// HTTP Client
var request = require("request");

// to format the dates
var moment = require('moment');

// to access the file system
var fs = require("fs");

// keys for Spotify API are stored here
var keys = require("./key.js")

/**
 * Get spotify instance with our id
 */
var spotify = new Spotify({
    id: keys.spotify.id,
    secret: keys.spotify.secret
});


const DEFAULT_SONG = "The Sign Ace of Base";
const DEFAULT_MOVIE = "Mr. Nobody";


/**
 *  Get user input
 * 
 *  process.argv[2] => action to perform [spotify-this-song/concert-this/movie-this/do-what-it-says]
 *  process.argv[3] => movie/song/artist name or undefined
 */
var action = process.argv[2];
var action_param = process.argv[3];

if (action === "do-what-it-says") {
    // get the action to be performed by reading the random.txt
    var action_info = getActionCmdFromFile();
    action = action_info.action;
    action_param = action_info.action_param;
}

switch (action) {

    case "movie-this":
        movieThis(action_param);
        break;

    case "concert-this":
        concertThis(action_param);
        break;

    case "spotify-this-song":
        spotifyThisSong(action_param);
        break;

    default:
        console.log("Invalid Command Entered");
        break;
}



/**
 * 
 *  Calls the Spotify API to get specified song information.
 *  Displays the song information if successfully received.
 *
 * @param {Song Name that the user want to get information about} song_name 
 */

function spotifyThisSong(song_name) {

    // set to the default song if user did not provide the song
    if (song_name === undefined)
        song_name = DEFAULT_SONG;

    // make the spotify api call to search for the song    
    spotify.search({ type: 'track', query: song_name }, function (err, data) {

        //if error occured, report to the user and return
        if (err) {
            return console.log('Error occurred: ' + err);
        }

        //data received successfully, display the song information
        console.log("\n============= SONG INFORMATION ==============");
        console.log("Artist(s):    " + data.tracks.items[0].artists[0].name);
        console.log("Song Name:    " + data.tracks.items[0].name);
        if (data.tracks.items[0].preview_url === null) {
            console.log("Preview Link: *** NOT AVAILABLE ***");
        } else {
            console.log("Preview Link: " + data.tracks.items[0].preview_url);
        }
        console.log("Album:        " + data.tracks.items[0].album.name);
        console.log("==============================================\n")
    });
}


/**
 *  This function queries the OMDB API to get information about the specified movie.
 *  On getting response from OMDB it parses the response and displays the specified
 *  fields for the movie.
 * 
 * @param {Movie name that the user want to get information about} movie_name 
 */

function movieThis(movie_name) {

    // set to the default movie if user did not provide the song
    if (movie_name === undefined)
        movie_name = DEFAULT_MOVIE;

    // Run a request to the OMDB API with the movie specified
    var queryUrl = "http://www.omdbapi.com/?t=" + movie_name + "&y=&plot=short&apikey=trilogy";

    request(queryUrl, function (error, response, body) {

        //if error occured, report to the user and return
        if (error) {
            return console.log('Error occurred: ' + err);
        }

        // If the request is successful, parse the response and display the specified fields
        if (response.statusCode === 200) {

            // Parse the body of the site and recover just the imdbRating
            // (Note: The syntax below for parsing isn't obvious. Just spend a few moments dissecting it).

            console.log("\n============================ MOVIE INFORMATION =============================");
            console.log("Title:                  " + JSON.parse(body).Title);
            console.log("Release Year:           " + JSON.parse(body).Year);
            console.log("IMDB Rating:            " + JSON.parse(body).Ratings[0].Value);
            console.log("Rotten Tomatoes Rating: " + JSON.parse(body).Ratings[1].Value);
            console.log("Country Where Produced: " + JSON.parse(body).Country);
            console.log("Language:               " + JSON.parse(body).Language);

            // Plot string can be long, so making it have 50 chars on one line
            // so we don't have to scroll to right
            var plot_str = JSON.parse(body).Plot;
            plot_str_len = plot_str.length;
            console.log("Plot:                   ");
            for (var i = 0; i < (plot_str_len / 50); i++) {
                console.log("\t\t\t" + plot_str.slice(i * 50, (i + 1) * 50));
            }

            console.log("Actors:                 " + JSON.parse(body).Actors);
            console.log("==============================================================================\n")

        } else {
            return console.log('OMDB API Request failed: ' + response.statusCode);
        }
    });

}

/**
 *  This function display the concert info passed as parameter
 * 
 * @param {information about venue, loc and date} concertInfo 
 * @param {event#} index 
 */

function displayConcertInfo(concertInfo, index) {

    console.log("\nEVENT#", + (index + 1));
    console.log("Venue Name:     " + concertInfo.venue.name);
    console.log("Venue Location: " + concertInfo.venue.city + ", " + concertInfo.venue.country);
    console.log("Event Date:     " + moment(concertInfo.datetime).format("MM/DD/YYYY"));
}


/**
 *  This function queries the OMDB API to get information about the specified movie.
 *  On getting response from OMDB it parses the response and displays the specified
 *  fields for the movie.
 * 
 * @param {Movie name that the user want to get information about} movie_name 
 */

function concertThis(artist_name) {


    console.log("at concert-this");

    // Run a request to the OMDB API with the movie specified
    var queryUrl = "https://rest.bandsintown.com/artists/" + artist_name + "/events?app_id=codingbootcamp";

    request(queryUrl, function (error, response, body) {

        //if error occured, report to the user and return
        if (error) {
            return console.log('Error occurred: ' + err);
        }

        // If the request is successful, parse the response and display the specified fields
        if (response.statusCode === 200) {
            //parse the JSON response and save it in array
            var parsed_response_array = JSON.parse(body);
            parsed_response_array.forEach(displayConcertInfo);

        } else {
            return console.log('OMDB API Request failed: ' + response.statusCode);
        }
    });


}

/**
 *  This function reads the random.txt file,
 *  parses the contents and returns the value
 *  in format:
 * 
 *  action: expected values are movie-this/concert-this/spotify-this-song
 *  action_params: song/movie/artist name
 */
function getActionCmdFromFile() {

    var ret_val = {
        action: "",
        action_param: ""
    };

    // This block of code will read from the "movies.txt" file.
    // It's important to include the "utf8" parameter or the code will provide stream data (garbage)
    // The code will store the contents of the reading inside the variable "data"
    var data = fs.readFileSync("random.txt", "utf8");

    // data is expected to be in the format:
    // movie-this, "movie name"

    //splitting the contents on ,
    var dataArray = data.split(",");
    // save the first entry - the command i.e concert-this/movie-this/spotify-this-song
    ret_val.action = dataArray[0];

    var param_str = dataArray[1];
    
    //get rid of the white space
    param_str = param_str.trim();
    
    // get rid of the extra "" at the begining and the end 
    ret_val.action_param = param_str.substring(1, param_str.length - 1);
    return ret_val;

}
