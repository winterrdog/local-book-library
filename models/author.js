const mongs = require("mongoose");
const lxn = require("luxon");

// define schema
const authorDef = {
    first_name: { type: String, required: true, maxLength: 100 },
    family_name: { type: String, required: true, maxLength: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date },
};

const AuthorSchema = new mongs.Schema(authorDef);

// virtual property for author's fullname
AuthorSchema.virtual("full_name").get(function () {
    return this.first_name && this.family_name
        ? `${this.family_name}, ${this.first_name}`
        : "";
});

// virtual property for author's URL
AuthorSchema.virtual("url").get(function () {
    return `/catalog/author/${this._id}`;
});

// virtual property for an author's life span on Earth
AuthorSchema.virtual("lifespan").get(function () {
    const dob = this.date_of_birth
        ? lxn.DateTime.fromJSDate(this.date_of_birth).toLocaleString(
              lxn.DateTime.DATE_MED
          )
        : "";

    const dod = this.date_of_death
        ? lxn.DateTime.fromJSDate(this.date_of_death).toLocaleString(
              lxn.DateTime.DATE_MED
          )
        : "";

    return `${dob} - ${dod}`;
});

AuthorSchema.virtual("norm_dob").get(function () {
    if (!this.date_of_birth) {
        return "";
    }

    const month = String(this.date_of_birth.getMonth() + 1).padStart(2, "0");
    const day = String(this.date_of_birth.getDate()).padStart(2, "0");
    const year = this.date_of_birth.getFullYear();

    return `"${year}-${month}-${day}"`;
});

AuthorSchema.virtual("norm_dod").get(function () {
    if (!this.date_of_death) {
        return "";
    }

    const month = String(this.date_of_death.getMonth() + 1).padStart(2, "0");
    const day = String(this.date_of_death.getDate()).padStart(2, "0");
    const year = this.date_of_death.getFullYear();

    return `"${year}-${month}-${day}"`;
});

// create model
const AuthorModel = mongs.model("Author", AuthorSchema);

// export the model
module.exports = AuthorModel;
