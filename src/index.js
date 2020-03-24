const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");

const {
    GenerateMessage,
    GenerateLocationMessage
} = require("./utils/messages"); //messages
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require("./utils/users"); //users

//SERVER CONFIG
const app = express();
const Server = http.createServer(app);
const io = socketio(Server);

//Heroku Path env Variable
const port =process.env.PORT || 3000;
const publicDirPath = path.join(__dirname, "../public");

app.use(express.static(publicDirPath));

io.on("connection", socket => {
    console.log("New Connection");

    socket.on("join", (options, callback) => {
        const { error, user } = addUser({
            id: socket.id,
            username: options.username,
            room: options.room
        });

        if (error) {
            return callback(error);
        }

        //Given socket joins a room
        socket.join(user.room);

        socket.emit("message", GenerateMessage("Admin", "Welcome"));
        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                GenerateMessage("Admin", `${user.username} Has Entered the Chat-Room`)
            );

        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
    });

    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback("PROFANITY IS NOT ALLOWED");
        }

        //SEND MESSAGE TO ALL USERS IN ROOM
        io.to(user.room).emit("message", GenerateMessage(user.username, message));
        callback();
    });

    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id);

        //SEND LOCATION
        io.to(user.room).emit(
            "locationMessage",
            GenerateLocationMessage(
                user.username,
                `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
            )
        );
        callback();
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        console.log(`${user.username} Has Left`);

        if (user) {
            io.to(user.room).emit(
                "message",
                GenerateMessage("Admin", `${user.username} Has Left The Chat-Room`)
            );

            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
});

Server.listen(port, () => {
    console.log(`LISTENING ON PORT ${port}!`);
});
