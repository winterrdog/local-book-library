const asyncHandler = require("express-async-handler");
const mongs = require("mongoose");
const {
    body,
    validationResult,
    matchedData,
} = require("express-validator");

// models
const Book = require("../models/book");
const BookInstance = require("../models/book_instance");

// Display list of all book instances
module.exports.book_instance_list = asyncHandler(async function (
    req,
    res,
    next
) {
    const allBookInstances = await BookInstance.find({})
        .populate("book")
        .exec();

    res.render("bookinstance_list", {
        title: "Book instance list",
        bookinstance_list: allBookInstances,
    });
});

// display detail page for a specific book_instance
module.exports.book_instance_detail = asyncHandler(async function (
    req,
    res,
    next
) {
    const bkInstId = new mongs.Types.ObjectId(req.params.id);
    const bookinstance = await BookInstance.findById(bkInstId)
        .populate("book")
        .exec();

    // no results
    if (!bookinstance) {
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_detail", {
        title: "Book:",
        bookinstance: bookinstance,
    });
});

// display book_instance create form on GET
module.exports.book_instance_create_get = asyncHandler(async function (
    req,
    res,
    next
) {
    const allBooks = await Book.find({}, "title").exec();

    res.render("bookinstance_form", {
        title: "Create a bookinstance",
        books: allBooks,
        selected_book: null,
        errors: null,
        bookinstance: null,
    });
});

// Handle book_instance create on POST.
module.exports.book_instance_create_post = [
    body("book", "Book must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("imprint", "Imprint must be speicfied")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    // process request after validation & sanitization
    asyncHandler(async function (req, res, next) {
        // extract the validation errors from a request
        const errors = validationResult(req);

        const bookinstance = new BookInstance(matchedData(req));

        // if there are validation errors
        if (!errors.isEmpty()) {
            const allBooks = await Book.find({}, "title").exec();

            return res.render("bookinstance_form", {
                title: "Create a bookinstance",
                books: allBooks,
                selected_book: bookinstance.book._id,
                errors: errors.array(),
                bookinstance: bookinstance,
            });
        }

        // if data is valid
        await bookinstance.save();
        res.redirect(bookinstance.url);
    }),
];

// Display book_instance delete form on GET.
module.exports.book_instance_delete_get = asyncHandler(async function (
    req,
    res,
    next
) {
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec();

    // no results
    if (!bookInstance) {
        res.redirect("/catalog/bookinstances");
        return;
    }

    res.render("bookinstance_delete", {
        title: "Delete a bookinstance",
        bookInstance: bookInstance,
        book: bookInstance.book,
    });
});

// Handle book_instance delete on POST.
module.exports.book_instance_delete_post = asyncHandler(async function (
    req,
    res,
    next
) {
    const bookInstance = await BookInstance.findById(
        req.params.id
    ).exec();

    // no results
    if (!bookInstance) {
        res.redirect("/catalog/bookinstances");
        return;
    }

    // delete book
    await BookInstance.findByIdAndRemove(req.body.book_instance_id);
    res.redirect("/catalog/bookinstances");
});

// Display book_instance update form on GET.
module.exports.book_instance_update_get = asyncHandler(async function (
    req,
    res,
    next
) {
    const book_instance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec();
    const allBooks = await Book.find({}, "title").exec();

    // no results
    if (!book_instance) {
        const err = new Error("Book instance not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_form", {
        title: "Update a bookinstance",
        books: allBooks,
        selected_book: book_instance.book._id,
        errors: null,
        bookinstance: book_instance,
    });
});

// Handle book_instance update on POST.
module.exports.book_instance_update_post = [
    body("book", "Book must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("imprint", "Imprint must be speicfied")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    // process request after validation & sanitization
    asyncHandler(async function (req, res, next) {
        // extract the validation errors from a request
        const errors = validationResult(req);

        const bookinstance = new BookInstance({
            ...matchedData(req),
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        // if there are validation errors
        if (!errors.isEmpty()) {
            const allBooks = await Book.find({}, "title").exec();

            return res.render("bookinstance_form", {
                title: "Create a bookinstance",
                books: allBooks,
                selected_book: bookinstance.book._id,
                errors: errors.array(),
                bookinstance: bookinstance,
            });
        }

        // if data is valid
        const the_bookinstance = await BookInstance.findByIdAndUpdate(
            req.params.id,
            bookinstance,
            {}
        );

        // redirect to the detail page
        return res.redirect(the_bookinstance.url);
    }),
];
