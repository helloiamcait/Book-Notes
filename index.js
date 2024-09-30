import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3002;

import dotenv from "dotenv";
dotenv.config();
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

const API_URL = "https://openlibrary.org";

const db = new pg.Client({
  user: DB_HOST,
  host: DB_USER,
  database: DB_PASSWORD,
  password: DB_NAME,
  port: DB_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let sortBy = "author";
let sortDirection = "DESC";
let books = [];

app.get("/", async (req, res) => {
    try {
        const result = await db.query(
          `SELECT * FROM books_read ORDER BY ${sortBy} ${sortDirection}`
        );
        books = result.rows;
        
        res.render("index.ejs", {
          bookItems: books,
        });
    } catch (err) {
        console.log(err);
    }
});

app.post("/edit", async (req, res) => {
    const id = req.body.updatedBookId;
    const note = req.body.updatedBookNote;

    try {
        await db.query("UPDATE books_read SET note = ($1) WHERE id = ($2)",
        [note, id]);
        res.redirect("/");
    } catch (err) {
        console.log(err)
    }
});

app.post("/delete", async (req, res) => {
    const id = req.body.deleteBookId;

    try {
        await db.query("DELETE FROM books_read WHERE id=$1", [id]);
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
})

app.post("/add", async (req,res) => {
    const title = req.body.bookTitle;
    const author = req.body.bookAuthor;
    const date = req.body.bookDate;
    const note = req.body.bookNote;
    const rating = req.body.bookRating;
    
    try {
        const response = await axios.get(
        `${API_URL}/search.json?title=${title}&author=${author}`
        );

        const coverId = response.data.docs[0].cover_i;

        await db.query("INSERT INTO books_read (title, date_read, author, rating, coverid, note) VALUES ($1, $2, $3, $4, $5, $6)", 
        [title, date, author, rating, coverId, note]);

        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

app.post("/sort", (req, res) => {
    sortBy = req.body.sort;
    if (sortBy === "author" || sortBy === "title") {
        sortDirection = "ASC";
    } else {
        sortDirection = "DESC";
    }
    
    res.redirect("/");
})

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}/`)
})