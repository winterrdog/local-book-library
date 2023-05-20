const express = require("express");
const catalog_router = express.Router();

// require controller modules
const book_ctrl = require("../controllers/book_controller");
const genre_ctrl = require("../controllers/genre_controller");
const bookinstance_ctrl = require("../controllers/bookinstance_controller");
const author_ctrl = require("../controllers/author_controller");

// --------------- ///
// BOOK routes     ///
// --------------- ///

catalog_router.get("/", book_ctrl.index); // home page

catalog_router
    .route("/book/create") // create a book
    .get(book_ctrl.book_create_get)
    .post(book_ctrl.book_create_post);

catalog_router
    .route("/book/:id/delete") // delete a book
    .get(book_ctrl.book_delete_get)
    .post(book_ctrl.book_delete_post);

catalog_router
    .route("/book/:id/update") // update a book
    .get(book_ctrl.book_update_get)
    .post(book_ctrl.book_update_post);

catalog_router.get("/book/:id", book_ctrl.book_detail); // get 1 book
catalog_router.get("/books", book_ctrl.book_list); // get list of all books

// --------------- ///
/// AUTHOR routes ///
// --------------- ///

// GET request for creating Author. NOTE This must come before route
// for id (i.e. display author).
catalog_router
    .route("/author/create")
    .get(author_ctrl.author_create_get)
    .post(author_ctrl.author_create_post);

catalog_router
    .route("/author/:id/delete") // delete an author
    .get(author_ctrl.author_delete_get)
    .post(author_ctrl.author_delete_post);

catalog_router
    .route("/author/:id/update") // update author info
    .get(author_ctrl.author_update_get)
    .post(author_ctrl.author_update_post);

catalog_router.get("/author/:id", author_ctrl.author_detail); // list 1 author
catalog_router.get("/authors", author_ctrl.author_list); // list all authors

// --------------- ///
/// GENRE routes ///
// --------------- ///

// GET request for creating a Genre. NOTE This must
// come before route that displays Genre (uses id).
catalog_router
    .route("/genre/create")
    .get(genre_ctrl.genre_create_get)
    .post(genre_ctrl.genre_create_post);

catalog_router
    .route("/genre/:id/delete") // delete a genre
    .get(genre_ctrl.genre_delete_get)
    .post(genre_ctrl.genre_delete_post);

catalog_router
    .route("/genre/:id/update") // update a genre
    .get(genre_ctrl.genre_update_get)
    .post(genre_ctrl.genre_update_post);

catalog_router.get("/genre/:id", genre_ctrl.genre_detail); // list 1 genre
catalog_router.get("/genres", genre_ctrl.genre_list); // list all genres

// ---------------      ///
// BOOKINSTANCE routes  ///
// ---------------      ///

// GET request for creating a BookInstance. NOTE This must come
// before route that displays BookInstance (uses id).
catalog_router
    .route("/bookinstance/create")
    .get(bookinstance_ctrl.book_instance_create_get)
    .post(bookinstance_ctrl.book_instance_create_post);

catalog_router
    .route("/bookinstance/:id/delete") // delete a bookinstance
    .get(bookinstance_ctrl.book_instance_delete_get)
    .post(bookinstance_ctrl.book_instance_delete_post);

catalog_router
    .route("/bookinstance/:id/update") // update a bookinstance
    .get(bookinstance_ctrl.book_instance_update_get)
    .post(bookinstance_ctrl.book_instance_update_post);

catalog_router.get(
    "/bookinstance/:id",
    bookinstance_ctrl.book_instance_detail
); // list 1 bookinstance

catalog_router.get(
    "/bookinstances",
    bookinstance_ctrl.book_instance_list
); // list all bookinstances

module.exports = catalog_router;
