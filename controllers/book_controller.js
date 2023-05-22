const mongs = require("mongoose");
const asyncHandler = require("express-async-handler");
const { body, validationResult, matchedData } = require("express-validator");
const debug = require("debug")("local-library:book");

// models
const Book = require("../models/book");
const BookInstance = require("../models/book_instance");
const Genre = require("../models/genre");
const Author = require("../models/author");

// display the home page
module.exports.index = asyncHandler(async function (req, res, next) {
    // get details of record counts( in parallel )
    const [
        numBooks,
        numBookInstances,
        numAvailableBookInstances,
        numAuthors,
        numGenres,
    ] = await Promise.all([
        Book.countDocuments({}).exec(),
        BookInstance.countDocuments({}).exec(),
        BookInstance.countDocuments({ status: "Available" }).exec(),
        Author.countDocuments({}).exec(),
        Genre.countDocuments({}).exec(),
    ]);

    res.render("index", {
        title: "Home",
        bookCount: numBooks,
        authorCount: numAuthors,
        genreCount: numGenres,
        bookInstanceCount: numBookInstances,
        bookInstanceAvailableCount: numAvailableBookInstances,
    });
});

// Display list of all books
module.exports.book_list = asyncHandler(async function (req, res, next) {
    // get all books from DB
    const allBooks = await Book.find({}, "title author")
        .sort({ title: 1 })
        .populate("author")
        .exec();

    // render tmpl
    res.render("book_list", {
        title: "All books",
        book_list: allBooks,
    });
});

// display detail page for a specific book
module.exports.book_detail = asyncHandler(async function (req, res, next) {
    // get details of books, book instances for specific book
    const bookId = new mongs.Types.ObjectId(req.params.id);
    const [book, bookInstances] = await Promise.all([
        Book.findById(bookId).populate("author").populate("genre").exec(),
        BookInstance.find({ book: bookId }).exec(),
    ]);

    // no results
    if (book === null) {
        debug(`id not found when querying the book's detail: ${req.params.id}`);
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
    }

    res.render("book_detail", {
        title: book.title,
        book: book,
        book_instances: bookInstances,
    });
});

// display book create form on GET
module.exports.book_create_get = asyncHandler(async function (req, res, next) {
    // get all authors and genres, which we
    // can use for adding to our book.
    const [allAuthors, allGenres] = await Promise.all([
        Author.find({}).exec(),
        Genre.find({}).exec(),
    ]);

    res.render("book_form", {
        title: "Create a book",
        authors: allAuthors,
        genres: allGenres,
        book: null,
        errors: null,
    });
});

// Handle book create on POST.
module.exports.book_create_post = [
    // convert the genre into an array
    function (req, res, next) {
        if (req.body.genre instanceof Array) {
            return next();
        }

        req.body.genre =
            typeof req.body.genre === "undefined"
                ? []
                : new Array(req.body.genre);
        return next();
    },

    // validate and sanitize fields
    body("title", "Title field can NOT be empty")
        .trim()
        .isLength({
            min: 1,
        })
        .escape(),
    body("author", "Author field can NOT be empty")
        .trim()
        .isLength({
            min: 1,
        })
        .escape(),
    body("summary", "Summary field can NOT be empty")
        .trim()
        .isLength({
            min: 1,
        })
        .escape(),
    body("isbn", "ISBN field can NOT be empty")
        .trim()
        .isLength({
            min: 1,
        })
        .escape(),
    body("genre.*").escape(),

    // process request after validation & sanitization
    asyncHandler(async function (req, res, next) {
        // extract validation errors from request
        const errors = validationResult(req);

        // create a book with validated data
        const book = new Book(matchedData(req));

        // render form again in case of errors with input data
        if (!errors.isEmpty()) {
            debug(
                `validation errors during creating a book: ${errors.array()}`
            );
            const [allAuthors, allGenres] = await Promise.all([
                Author.find({}).exec(),
                Genre.find({}).exec(),
            ]);

            // Mark our selected genres as checked.
            for (const genre of allGenres) {
                if (book.genre.indexOf(genre._id) > -1) {
                    genre.checked = "true";
                }
            }

            return res.render("book_form", {
                title: "Create a book",
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array(),
            });
        }

        // data from form is VALID
        await book.save();
        res.redirect(book.url);
    }),
];

// Display book delete form on GET.
module.exports.book_delete_get = asyncHandler(async function (req, res, next) {
    const [book, allBookInstances] = await Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }).exec(),
    ]);

    // no results
    if (book === null) {
        debug(
            `id not found when querying the book to delete: ${req.params.id}`
        );
        res.redirect("/catalog/books");
        return;
    }

    res.render("book_delete", {
        title: "Delete a book",
        book: book,
        book_instances: allBookInstances,
    });
});

// Handle book delete on POST.
module.exports.book_delete_post = asyncHandler(async function (req, res, next) {
    const [book, allBookInstances] = await Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }).exec(),
    ]);

    // no results
    if (book === null) {
        debug(`id not found when posting the book to delete: ${req.params.id}`);
        res.redirect("/catalog/books");
        return;
    }

    // if there are other instances that reference the book in question
    if (allBookInstances.length > 0) {
        res.render("book_delete", {
            title: "Delete a book",
            book: book,
            book_instances: allBookInstances,
        });
        return;
    }

    // if book has no instances
    await Book.findByIdAndRemove(req.body.book_id);
    res.redirect("/catalog/books");
});

// Display book update form on GET.
module.exports.book_update_get = asyncHandler(async function (req, res, next) {
    // get book, authors and genres for form
    const [book, allAuthors, allGenres] = await Promise.all([
        Book.findById(req.params.id)
            .populate("author")
            .populate("genre")
            .exec(),
        Author.find({}).exec(),
        Genre.find({}).exec(),
    ]);

    // if no results, send out a 404 page
    if (book === null) {
        debug(
            `id not found when querying the book to update: ${req.params.id}`
        );
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
    }

    // mark our "selected" genres as checked
    for (const genre of allGenres) {
        for (const x of book.genre) {
            if (genre._id.toString() === x._id.toString()) {
                genre.checked = "true";
            }
        }
    }

    res.render("book_form", {
        title: "Update a book",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: null,
    });
});

// Handle book update on POST.
module.exports.book_update_post = [
    // cast the genre into an 'array'
    function (req, res, next) {
        if (req.body.genre instanceof Array) {
            return next();
        }

        req.body.genre =
            typeof req.body.genre === "undefined"
                ? []
                : new Array(req.body.genre);

        next();
    },

    // validate and sanitize
    body("title", "title must NOT be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("author", "author must NOT be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("summary", "summary must NOT be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("isbn", "isbn must NOT be empty").trim().isLength({ min: 1 }).escape(),
    body("genre.*").escape(),

    // process request only after validation & sanitization
    asyncHandler(async function (req, res, next) {
        // extract the validation errors from a request
        const errors = validationResult(req);

        // create a book with old id
        const data = matchedData(req);
        const { title, author, summary, isbn } = data;
        const book = new Book({
            title,
            author,
            summary,
            isbn,
            genre: typeof data.genre === "undefined" ? [] : data.genre,
            _id: req.params.id, //needed so as to avoid assignment of a new ID
        });

        if (!errors.isEmpty()) {
            debug(
                `validation errors during updating a book on POST: ${req.params.id}`
            );
            // get all authors and genres for form
            const [allAuthors, allGenres] = await Promise.all([
                Author.find({}).exec(),
                Genre.find({}).exec(),
            ]);

            // mark our selected genres as checked
            for (const x of allGenres) {
                if (book.genre.indexOf(x) > -1) {
                    x.checked = "true";
                }
            }

            return res.render("book_form", {
                title: "Update a book",
                authors: allAuthors,
                genres: allGenres,
                book,
                errors: errors.array(),
            });
        }

        // if data is valid. update the record
        const the_book = await Book.findByIdAndUpdate(req.params.id, book, {
            runValidators: true,
        });

        // redirect to the detail page
        return res.redirect(the_book.url);
    }),
];
