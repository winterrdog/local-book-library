const mongs = require("mongoose");
const asyncHandler = require("express-async-handler");
const { body, validationResult, matchedData } = require("express-validator");
const debug = require("debug")("local-library:genre");

// models
const Genre = require("../models/genre");
const Book = require("../models/book");

// Display list of all genres
module.exports.genre_list = asyncHandler(async function (req, res, next) {
    const allGenres = await Genre.find({}).sort({ name: 1 }).exec();

    res.render("genre_list", {
        title: "Genres list",
        genre_list: allGenres,
    });
});

// display detail page for a specific genre
module.exports.genre_detail = asyncHandler(async function (req, res, next) {
    // get details of genre and all associated books( in parallel )
    const genreID = new mongs.Types.ObjectId(req.params.id);
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(genreID).exec(),
        Book.find({ genre: genreID }, "title summary").exec(),
    ]);

    // no results
    if (!genre) {
        debug(`id not found when querying genre's detail: ${req.params.id}`);
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
    }

    res.render("genre_detail", {
        title: "Genre detail",
        genre: genre,
        genre_books: booksInGenre,
    });
});

// display genre create form on GET
module.exports.genre_create_get = function (req, res, next) {
    res.render("genre_form", {
        title: "Create a genre",
        genre: null,
        errors: null,
    });
};

// Handle genre create on POST.
module.exports.genre_create_post = [
    // validate and sanitize the 'name' field
    body("name", "Genre name must contain at least 3 characters")
        .trim() // remove whitespaces
        .isLength({
            min: 3,
        })
        .escape(), // prevent XSS attacks
    asyncHandler(async function (req, res, next) {
        // extract the validation errors from a request
        const errors = validationResult(req);

        // create a genre obj with escaped and trimmed data
        const { santzName } = matchedData(req);
        const genre = new Genre({ name: santzName });

        // if errors are 'present', render the form again with sanitized
        // values/error messages
        if (!errors.isEmpty()) {
            debug(`validation errors from client: ${errors.array()}`);
            return res.render("genre_form", {
                title: "Create a genre",
                genre,
                errors: errors.array(),
            });
        }

        // if form data is valid, check for dups
        const genreExists = await Genre.findOne({
            name: santzName,
        }).exec();
        if (genreExists) {
            return res.redirect(genreExists.url);
        }

        // save new genre to db
        await genre.save();
        return res.redirect(genre.url);
    }),
];

// Display genre delete form on GET.
module.exports.genre_delete_get = asyncHandler(async function (req, res, next) {
    // get details of a genre and all the books
    const [genre, allBooksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, "title summary").exec(),
    ]);

    // no results from db
    if (!genre) {
        debug(`id not found when querying genre to delete: ${req.params.id}`);
        res.redirect("/catalog/genres");
        return;
    }

    res.render("genre_delete", {
        title: "Delete a genre",
        genre: genre,
        genre_books: allBooksInGenre,
    });
});

// Handle genre delete on POST.
module.exports.genre_delete_post = asyncHandler(async function (
    req,
    res,
    next
) {
    // get details of a genre and all the books
    const [genre, allBooksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, "title summary").exec(),
    ]);

    // no results from db
    if (!genre) {
        debug(`id not found when posting genre to delete: ${req.params.id}`);
        res.redirect("/catalog/genres");
        return;
    }

    // if there r some books that still "reference" the genre
    if (allBooksInGenre.length > 0) {
        res.render("genre_delete", {
            title: "Delete a genre",
            genre: genre,
            genre_books: allBooksInGenre,
        });
        return;
    }

    // if genre has no books
    await Genre.findByIdAndRemove(req.body.genre_id);
    res.redirect("/catalog/genres");
});

// Display genre update form on GET.
module.exports.genre_update_get = asyncHandler(async function (req, res, next) {
    // get necessary genre from db
    const genre = await Genre.findById(req.params.id).exec();

    // no results
    if (!genre) {
        debug(`id not found when querying genre to update: ${req.params.id}`);
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
    }

    // send back the results in a view
    res.render("genre_form", {
        title: "Update a genre",
        genre,
        errors: null,
    });
});

// Handle genre update on POST.
module.exports.genre_update_post = [
    // validate and sanitize the 'name' field
    body("name", "Genre name must contain at least 3 characters")
        .trim() // remove whitespaces
        .isLength({
            min: 3,
        })
        .escape(), // prevent XSS attacks
    asyncHandler(async function (req, res, next) {
        // extract the validation errors from a request
        const errors = validationResult(req);

        // create a genre obj using the id in the request
        // with escaped and trimmed data
        const genre = new Genre({
            ...matchedData(req),
            _id: req.params.id,
        });

        // if errors are 'present', render the form again with sanitized
        // values/error messages
        if (!errors.isEmpty()) {
            debug(`validation errors from client: ${errors.array()}`);
            return res.render("genre_form", {
                title: "Create a genre",
                genre,
                errors: errors.array(),
            });
        }

        // if data is valid
        const the_genre = await Genre.findByIdAndUpdate(
            req.params.id,
            genre,
            {}
        );

        // redirect to the detail page
        return res.redirect(the_genre.url);
    }),
];
