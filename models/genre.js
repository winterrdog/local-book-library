const mongs = require("mongoose");

// define schema
const genreDef = {
    name: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 100,
    },
};

const GenreSchema = new mongs.Schema(genreDef);

GenreSchema.virtual("url").get(function () {
    return `/catalog/genre/${this._id}`;
});

// create model
const GenreModel = mongs.model("Genre", GenreSchema);

// export the model
module.exports = GenreModel;
