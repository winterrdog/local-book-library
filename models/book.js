const mongs = require("mongoose");

// define schema
const bookDef = {
    title: { type: String, required: true },
    author: {
        type: mongs.Schema.Types.ObjectId,
        ref: "Author",
        required: true,
    },
    summary: { type: String, required: true },
    isbn: { type: String, required: true },
    genre: [{ type: mongs.Schema.Types.ObjectId, ref: "Genre" }],
};

const BookSchema = new mongs.Schema(bookDef);

// virtual property for book's url
BookSchema.virtual("url").get(function () {
    return `/catalog/book/${this._id}`;
});

// create model
const BookModel = mongs.model("Book", BookSchema);

// export model
module.exports = BookModel;
