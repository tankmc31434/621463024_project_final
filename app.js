const express = require("express");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Server configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false })); // <--- middleware configuration
// Connection to the SQlite database
const db_name = path.join(__dirname, "/database", "user.db");
const db = new sqlite3.Database(db_name, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful connection to the database 'user.db'");
});
const sql_create = `CREATE TABLE IF NOT EXISTS user (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL
  );`;
db.run(sql_create, (err, row) => {
    if (err) {
        console.error(err.message)
    }
    console.log("สร้างdb สำเร็จ")
})
// Starting the server
app.listen(3000, () => {
    console.log("Server started (http://localhost:3000/) !");
})
//การสร้างหน้ารูต
app.get("/", (req, res) => {
    res.render("login");
});
app.get("/index", (req, res) => {
    res.render("index");
});
app.get("/insert", (req, res) => {
    res.render("insert");
});

app.get("/showdata", (req, res) => {
    const sql = "SELECT * FROM user "
    db.all(sql, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        res.render("showdata", { model: rows });
    });
});
// POST /create
app.post("/insert", (req, res) => {
    const sql = "INSERT INTO user (name, email, password) VALUES (?, ?, ?)";
    const book = [req.body.name, req.body.email, req.body.password];
    db.run(sql, book, err => {
        // if (err) ...
        res.redirect("/");
    });
})
// GET /edit/5
app.get("/editdata/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM user WHERE ID = ?";
    db.get(sql, id, (err, row) => {
        // if (err) ...
        res.render("editdata", { model: row });
    });
});
// POST /edit/5
app.post("/editdata/:id", (req, res) => {
    const id = req.params.id;
    const book = [req.body.name, req.body.email, req.body.password, id];
    const sql = "UPDATE user SET name = ?, email = ?, password = ? WHERE (ID = ?)";
    db.run(sql, book, err => {
        // if (err) ...
        res.redirect("/showdata");
    });
});
// GET /delete/5
app.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM user WHERE ID = ?";
    db.get(sql, id, (err, row) => {
        // if (err) ...
        res.render("delete", { model: row });
    });
});
// POST /delete/5
app.post("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM user WHERE ID = ?";
    db.run(sql, id, err => {
        // if (err) ...
        res.redirect("/showdata");
    });
});
app.post("/index", (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM user WHERE email = ?", [email], (err, user) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error404");
            return;
        }

        if (!user || user.password !== password) {
            res.status(401).send("The password or username is incorrect.");
            return;
        }

        res.render("index");
        
    });
});
/////////////////////////////////////////////////
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
};
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));
app.get("/room", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    setTimeout(() => {
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 1000);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});
server.listen(process.env.PORT || 3030);