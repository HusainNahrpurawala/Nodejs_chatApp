const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = document.querySelector("#message-input");
const $messageFormButton = document.querySelector("#message-button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemp = document.querySelector("#message-template").innerHTML;
const locationTemp = document.querySelector("#location-message-template")
    .innerHTML;
const sidebarTemp = document.querySelector("#sidebar-template").innerHTML;
//From queryString
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

socket.on("message", message => {
    console.log(message);

    const html = Mustache.render(messageTemp, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    });

    $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("locationMessage", message => {
    console.log(message);

    const html = Mustache.render(locationTemp, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    });

    $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemp, {
        room,
        users
    });
    document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", event => {
    event.preventDefault();

    $messageFormButton.setAttribute("disabled", "disabled");

    const message = event.target.elements.message.value;

    socket.emit("sendMessage", message, error => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
        console.log("Message Delivered");
    });
});

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your Browser");
    }

    $sendLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition(position => {
        socket.emit(
            "sendLocation", {
                lat: position.coords.latitude,
                long: position.coords.longitude
            },
            () => {
                $sendLocationButton.removeAttribute("disabled");
                console.log("Location Shared");
            }
        );
    });
});

socket.emit("join", { username, room }, error => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});