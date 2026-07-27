const uiStartXPos = 10;

const waitTime = 1000;
const connectionTimeoutTime = 5000;
let connectionStartTime;
let connectionEndTime;
let timeoutFunctionId;
let isInGame = false;
function timeoutFunction() {
    connectionEndTime = performance.now() - connectionStartTime;
    if (debug) {
        console.log(`Waited ${connectionEndTime / 1000} second(s) so far...`);
    }

    if (connectionEndTime > connectionTimeoutTime) {
        if (debug) {
            console.log(`Timeout! ${connectionTimeoutTime / 1000} second(s) have passed`);
        }
        // reset client class
        if (Client.id) {
            Client.id = undefined;
        }
        if (Client.connected) {
            Client.connected = false;
        }
        if (Client.webSocket) {
            Client.webSocket.close();
        }
        retryConnectionScreen();
        clearInterval(timeoutFunctionId);
    }
};

function init() {
    ignitionScreen();
}

function ignitionScreen() {
    // Initialize camera with proper aspect ratio
    const canvas = document.getElementById('c');
    const aspectRatio = canvas.width / canvas.height;
    Camera.main.displayHeight = 25;
    Camera.main.displayWidth = 25 * aspectRatio;
    Camera.ui.displayHeight = 25;
    Camera.ui.displayWidth = 25 * aspectRatio;

    //Need to call menu after click
    const ignitionBarrel = new UIPanel(0, 0, 10, 10, ["textures/menu/ignition_0.png", "textures/menu/ignition_1.png", "textures/menu/ignition_2.png"]);
    UILayer.push(ignitionBarrel);
    ignitionBarrel.transparent = true;
    ignitionBarrel.update = function() {
        if(this.mouseHovering) {
            this.textureIndex = 1;
        } else {
            this.textureIndex = 0;
        }
    }
    ignitionBarrel.whenClicked = function() {
        this.textureIndex = 2;
        let ticks = 0;
        ignitionBarrel.update = () => {
            ticks++;
            if(ticks/updatesPerSecond == 2) {
                sceneGraph.reset();
                loadMenu();
            }
        }
    }
}

function loadMenu() {
    // Initialize camera with proper aspect ratio
    const canvas = document.getElementById('c');
    const aspectRatio = canvas.width / canvas.height;
    Camera.main.displayHeight = 25;
    Camera.main.displayWidth = 25 * aspectRatio;
    Camera.ui.displayHeight = 25;
    Camera.ui.displayWidth = 25 * aspectRatio;

    const menuMusicEle = audio.loadAudio("sounds/menu_music.mp3");
    menuMusicEle.play(true);
    
    const propXLoc = -37.5;
    const carYLoc = -10;

    const car = new SceneNode();
    car.translation = [propXLoc, carYLoc, -80];
    car.scale = [5, 5, 5];
    car.update = () => {};
    //car.translation
    car.addMesh(["models/car/car.fbx"]);

    //1st layer booster
    car.update = () => {
        car.rotate(0, 0.0125, 0);
        const booster1 = car.getChildByMesh("booster_1");

        if (booster1) {
            const a = 0.05;
            const f = 8;
            const vibration =
                a * Math.sin((2 * Math.PI * performance.now() * f) / 1000);

            const scale = vibration + 1;

            booster1.scale = [scale, scale, scale];
        }
        //Second layer booster
        const booster2 = car.getChildByMesh("booster_2");
        if (booster2) {
            const a = 0.05;
            const f = 8;
            const vibration =
                a * Math.sin((2 * Math.PI * performance.now() * f) / 1000);

            const scale = vibration + 1;
            booster2.scale = [scale, scale, scale];
        }
    };

    const backdrop = new SceneNode();
    backdrop.addMesh(["models/menu/backdrop.fbx"]);
    backdrop.translation = [propXLoc, carYLoc - 10, -80];
    backdrop.scale = [0.2, 0.2, 0.2];

    const background = new SceneNode();
    background.addMesh(["models/menu/menubackground.fbx"]);
    background.translation = [propXLoc, carYLoc + 5, -80];
    background.scale = [2, 2, 2];
    background.update = () => {
        const factor = 0.03125;
        background.rotate(0.05 * factor, 0.025 * factor, 0.0125 * factor);
    };

    sceneGraph.root.addChild(car);
    sceneGraph.root.addChild(backdrop);
    sceneGraph.root.addChild(background);

    mainMenuScreen();
}

function mainMenuScreen() {
    clearUIPanel();

    // Game Title
    const gameTitleTxt = new UIPanel(0, 10, 30, 6, ["textures/menu/logo.png"]);
    gameTitleTxt.transparent = true;
    UILayer.push(gameTitleTxt);

    // Play Online button
    const playOnlineBtn = new UIPanel(uiStartXPos, 2, 19.5, 4.5, [
        "textures/menu/connect_button_bg_0.png",
        "textures/menu/connect_button_bg_1.png",
    ]);
    playOnlineBtn.addText("Play Online");
    playOnlineBtn.whenClicked = function () {
        try {
            connectToLobby();
        } catch (e) {
            retryConnectionScreen();
        }
    };
    playOnlineBtn.update = function () {
        if (this.mouseHovering) {
            this.textureIndex = 1;
        } else {
            this.textureIndex = 0;
        }
    };
    UILayer.push(playOnlineBtn);

    const playOfflineBtn = new UIPanel(uiStartXPos, -5, 19.5, 4.5, [
        "textures/menu/offline_button_bg_0.png",
        "textures/menu/offline_button_bg_1.png",
    ]);
    playOfflineBtn.addText("Play Offline");
    playOfflineBtn.whenClicked = function () {
        loadTrack(0);
        Client.id = 1;
        allClientsLoaded = true;
        Client.state = "racing";
    };
    playOfflineBtn.update = function () {
        if (this.mouseHovering) {
            this.textureIndex = 1;
        } else {
            this.textureIndex = 0;
        }
    };
    UILayer.push(playOfflineBtn);
}

function connectToLobby() {
    connectionStartTime = performance.now();

    Client.onOpen = (e) => {
        try {
            Client.synchronizeServerTime(5);
            lobbyMenu();
            clearInterval(timeoutFunctionId);
        } catch (e) {
            // reset client class
            if (Client.id) {
                Client.id = undefined;
            }
            if (Client.connected) {
                Client.connected = false;
            }
            if (Client.webSocket) {
                Client.webSocket.close();
            }
            retryConnectionScreen();
        } finally {
            connectionEndTime = performance.now() - connectionStartTime;
            if (debug) {
                console.log(`Connection process took ${connectionEndTime / 1000} second(s)`);
            }
        }
    };

    Client.connect();
    connectingScreen();
}

function connectingScreen() {
    clearUIPanel();

    const connectingPrompt = new UIPanel(uiStartXPos, 0, 14, 3, ["textures/menu/connecting_bg.png"]); 
    connectingPrompt.addText("Connecting...", 2);
    UILayer.push(
        connectingPrompt
    );

    timeoutFunctionId = setInterval(timeoutFunction, waitTime);
}

function retryConnectionScreen() {
    clearUIPanel();

    const serverErrorTxt = new UIPanel(uiStartXPos, 0, 30, 3, [
        "textures/menu/player_bg.png",
    ]);
    serverErrorTxt.addText("Unable to connect to server.", 0.75);
    UILayer.push(serverErrorTxt);

    const retryBtn = new UIPanel(uiStartXPos, -5, 3 * 4, 3, [
        "textures/menu/connect_button_bg_0.png",
        "textures/menu/connect_button_bg_1.png",
    ]);
    retryBtn.addText("Retry");
    UILayer.push(retryBtn);
    retryBtn.whenClicked = function () {
        try {
            connectToLobby();
        } catch (e) {
            retryConnectionScreen();
        }
    };
    retryBtn.update = function () {
        if (this.mouseHovering) {
            this.textureIndex = 1;
        } else {
            this.textureIndex = 0;
        }
    };

    const returnBtn = new UIPanel(uiStartXPos, -10, 16, 3, [
        "textures/menu/connect_button_bg_0.png",
        "textures/menu/connect_button_bg_1.png",
    ]);
    returnBtn.addText("Back to Menu");
    UILayer.push(returnBtn);
    returnBtn.whenClicked = function () {
        mainMenuScreen();
    };
    returnBtn.update = function () {
        if (this.mouseHovering) {
            this.textureIndex = 1;
        } else {
            this.textureIndex = 0;
        }
    };
}

document.addEventListener("click", function () {
    audio.audioContext.resume().then(() => {
        // console.log("Playback resumed successfully");
    });
});