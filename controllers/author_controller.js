const asyncHandler = require("express-async-handler");
const mongs = require("mongoose");
const {
    body,
    validationResult,
    matchedData,
} = require("express-validator");

// models
const Author = require("../models/author");
const Book = require("../models/book");

// Display list of all authors
module.exports.author_list = asyncHandler(async function (
    req,
    res,
    next
) {
    const allAuthors = await Author.find({})
        .sort({ family_name: 1 })
        .exec();

    res.render("author_list", {
        title: "Authors list",
        author_list: allAuthors,
    });
});

// display detail page for a specific author
module.exports.author_detail = asyncHandler(async function (
    req,
    res,
    next
) {
    const authorId = new mongs.Types.ObjectId(req.params.id);
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(authorId).exec(),
        Book.find({ author: authorId }, "title summary").exec(),
    ]);

    // no results
    if (!author) {
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }

    res.render("author_detail", {
        title: "Author detail",
        author: author,
        author_books: allBooksByAuthor,
    });
});

// display author create form on GET
module.exports.author_create_get = function (req, res, next) {
    res.render("author_form", {
        title: "Create an author",
        author: null,
        errors: null,
    });
};

// Handle Author create on POST.
module.exports.author_create_post = [
    body("first_name")
        .trim()
        .isLength({
            min: 1,
        })
        .escape()
        .withMessage("First name must be specified.")
        .isAlphanumeric() // not encouraged for international programs
        .withMessage("First name has non-alphanumeric characters"),
    body("family_name")
        .trim()
        .isLength({
            min: 1,
        })
        .escape()
        .withMessage("Family name must be given.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({
            checkFalsy: true,
        })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({
            checkFalsy: true,
        })
        .isISO8601()
        .toDate(),
    // process request after sanitization and validation
    asyncHandler(async function (req, res, next) {
        // extract the validation errors from request
        const errors = validationResult(req);

        const data = matchedData(req);
        const author = new Author(data);

        // if there are errors. Render form again with
        // sanitized values/errors messages.
        if (!errors.isEmpty()) {
            return res.render("author_form", {
                title: "Create author",
                author: author,
                errors: errors.array(),
            });
        }

        // if data is valid
        await author.save();
        res.redirect(author.url); // redirect to new record
    }),
];

// Display Author delete form on GET.
module.exports.author_delete_get = asyncHandler(async function (
    req,
    res,
    next
) {
    // get details of an author and all their books( in parallel )
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    // no results
    if (!author) {
        res.redirect("/catalog/authors");
        return;
    }

    res.render("author_delete", {
        title: "Delete an author",
        author: author,
        author_books: allBooksByAuthor,
    });
});

// Handle Author delete on POST.
module.exports.author_delete_post = asyncHandler(async function (
    req,
    res,
    next
) {
    // get details of an author and all their books( in parallel )
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec(),
    ]);

    // no results
    if (!author) {
        res.redirect("/catalog/authors");
        return;
    }

    // if an author has books, then ask user to 1st "delete" his books
    if (allBooksByAuthor.length > 0) {
        res.render("author_delete", {
            title: "Delete an author",
            author: author,
            author_books: allBooksByAuthor,
        });
        return;
    }

    // if author has no books, just delete
    await Author.findByIdAndRemove(req.body.author_id);
    res.redirect("/catalog/authors");
});

// Display Author update form on GET.
module.exports.author_update_get = asyncHandler(async function (
    req,
    res,
    next
) {
    // get all necessay data tied to id
    const author = await Author.findById(req.params.id).exec();

    // no results
    if (!author) {
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }

    // send results via a view
    res.render("author_form", {
        title: "Update an author",
        author: author,
        errors: null,
    });
});

// Handle Author update on POST.
module.exports.author_update_post = [
    body("first_name")
        .trim()
        .isLength({
            min: 1,
        })
        .escape()
        .withMessage("First name must be specified.")
        .isAlphanumeric() // not "encouraged" for international programs
        .withMessage("First name has non-alphanumeric characters"),
    body("family_name")
        .trim()
        .isLength({
            min: 1,
        })
        .escape()
        .withMessage("Family name must be given.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({
            checkFalsy: true,
        })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({
            checkFalsy: true,
        })
        .isISO8601()
        .toDate(),

    // process request after sanitization and validation
    asyncHandler(async function (req, res, next) {
        // extract errors created during validation and sanitization
        const errors = validationResult(req);

        // create an author using validate & sanitized values
        const author = new Author({
            ...matchedData(req),
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        // if there are errors. Render form again with
        // sanitized values/errors messages.
        if (!errors.isEmpty()) {
            return res.render("author_form", {
                title: "Update an author",
                author: author,
                errors: errors.array(),
            });
        }

        // if data is valid. update the document
        const the_author = await Author.findByIdAndUpdate(
            req.params.id,
            author,
            {}
        );

        // redirect to the detail page
        return res.redirect(the_author.url);
    }),
];
