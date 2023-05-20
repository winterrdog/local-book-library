#!/usr/bin/env bash

# node populatedb "mongodb+srv://xola:AQZUJ4bJTwfvvXnY4qkcype3YypF2cej@dbclst0.fadtg3n.mongodb.net/local_library?retryWrites=true&w=majority"
mkdir controllers
touch controllers/author_controller.js \
	controllers/bookinstance_controller.js \
	controllers/book_controller.js \
	controllers/genre_controller.js
