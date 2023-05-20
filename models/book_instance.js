const mongs = require("mongoose");
const lxn = require("luxon");

// define schema
const bookInstanceDef = {
    book: {
        type: mongs.Schema.Types.ObjectId,
        ref: "Book",
        required: true,
    }, // reference to the associated book
    imprint: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ["Available", "Maintenance", "Loaned", "Reserve"],
        default: "Maintenance",
    },
    due_back: { type: Date, default: Date.now },
};

const BookInstanceSchema = new mongs.Schema(bookInstanceDef);

BookInstanceSchema.virtual("url").get(function () {
    return `/catalog/bookinstance/${this._id}`;
});

BookInstanceSchema.virtual("due_back_formatted").get(function () {
    return lxn.DateTime.fromJSDate(this.due_back).toLocaleString(
        lxn.DateTime.DATETIME_MED
    );
});

BookInstanceSchema.virtual("norm_due_back").get(function () {
    if (!this.due_back) {
        return "";
    }

    const month = String(this.due_back.getMonth() + 1).padStart(2, "0");
    const day = String(this.due_back.getDate()).padStart(2, "0");
    const year = this.due_back.getFullYear();

    return `"${year}-${month}-${day}"`;
});

// create model
const BookInstanceModel = mongs.model(
    "BookInstance",
    BookInstanceSchema
);

// export the model
module.exports = BookInstanceModel;
