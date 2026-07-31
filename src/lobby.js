/* Deals with the rendering and netcode of the lobby screen
E.g. the screen that shows all the available lobbies and 
the screen once joined a lobby. */

const LOBBIES_PER_PAGE = 10; // Only show 5 lobbies at a time

const idToUser = new Map(); // A map that maps client IDs to user data for each user.

let lobbyID;

function UserObject(username, id) {
    //UserObject constructor function for user data
    this.username = username;
    this.id = id;
}

function lobbyMenu() {

    clearUIPanel(); // Removes UI but keeps background

    let selection; // Indicates which lobby listing that has been selected.

    function lobbyCreationPrompt() {
        const text = gameUI.createHeader(0, 6, "Enter lobby name");
        text.addText("Enter lobby name:");
        const textBox = new UIPanel(0, 0, 20, 3, ["./textures/menu/main_menu_button_bg_0.png", "./textures/menu/main_menu_button_bg_1.png"]);
        const highlightOnMouseHover = function() {
            if(this.mouseHovering || this.hasFocus) {
                this.textureIndex = 1;
            } else {
                this.textureIndex = 0;
            }
        }
        textBox.update = highlightOnMouseHover;
        textBox.addTextInput();
        const createButton = new UIPanel(5, -5, 8, 2, ["./textures/menu/begin_button_bg_0.png", "./textures/menu/begin_button_bg_1.png"])
        createButton.addText("Create");
        createButton.update = highlightOnMouseHover;
        createButton.whenClicked = () => {
            Client.send({
                type:"create_lobby",
                lobbyName:textBox.textContent
            }) 
        }
        UILayer.push(createButton);
        UILayer.push(text);
        UILayer.push(textBox);
        Client.onMessage = (e) => {
            const msg = JSON.parse(e.data);
            if(msg.type === "lobby_create_successful") {
                lobbyID = msg.lobbyID;
                promptUsername();
            } 
            // else if(msg.type === "lobby_create_unsuccessful") {
            //     retryLobbyCreation();
            // }
        }
    }

    //TODO: continue implementation once server side name checking
    // function retryLobbyCreation(reason) {
    //     const errorMessage = new UIPanel(0, 5, 1, 3);
    //     errorMessage.addText(reason + " Please try again");
    //     const okButton = new UIPanel(0, 0, 8, 2, ["./textures/menu/begin_button_bg_0.png", "./textures/menu/begin_button_bg_1.png"]);
    //     okButton.addText("okay");
    //     UILayer.push(okButton);
    //     UILayer.push(errorMessage);
    // }

    function displayListings(lobbyListings) {
        //Called when lobby listing information is recieved
        const bgX = 0;
        const bgY = 0;
        const bgWidth = 15;
        const bgHeight = 15;
        const bg = new UIPanel(bgX, bgY, bgWidth, bgHeight, ["./textures/menu/lobby_players_panel.png"]);
        bg.z -= 0.1;
        bg.recalculateVertices();
        //Divide into lobbies per page
        const listingHeight = bgHeight / LOBBIES_PER_PAGE;
        const listingWidth = bgWidth;

        for(let i = 0; i < lobbyListings.length; i++) {
            const listing = lobbyListings[i];
            const uiComponent = new UIPanel(bgX, bgY + bgHeight /2 - listingHeight/2 - i * listingHeight , listingWidth, listingHeight, ["./textures/menu/main_menu_button_bg_0.png", "./textures/menu/main_menu_button_bg_1.png"]);
            
            uiComponent.addText(`${listing.name}   ${listing.playersCount}/4`);
            uiComponent.transparent = true;
            uiComponent.update = () => {
                uiComponent.textureIndex = uiComponent.mouseHovering || uiComponent.hasFocus ? 1: 0;
            }
            uiComponent.whenClicked = () => {
                selection = lobbyListings[i];
                showJoinLobbyButton();
                //console.log(`Selection: ${i}`);
            }
            UILayer.push(uiComponent);
        }

        UILayer.push(bg);
    }

    let joinButtonShown = false;
    let joinButton;
    function showJoinLobbyButton() {
        if(!joinButtonShown) {
            joinButtonShown = true;
            joinButton = new UIPanel(5, -9, 8, 2, ["./textures/menu/begin_button_bg_0.png", "./textures/menu/begin_button_bg_1.png"])
            joinButton.addText("Join");
            joinButton.update = () => {
                joinButton.textureIndex = joinButton.mouseHovering ? 1 : 0;
                if(UIPanel.getFocused().length == 0) {
                    hideJoinButton(); // No lobby selected
                }
            }
            joinButton.whenClicked = () => {
                //Need to show username prompt.
                promptUsername();
            };
            UILayer.push(joinButton);
        }
    }
    function hideJoinButton() {
        if(joinButtonShown) {
            joinButtonShown = false;
            removeUIPanel(joinButton);
        }
    }
    
    function promptUsername() {
        clearUIPanel();
        const text = gameUI.createHeader(0, 6, "Enter your username");
        text.addText("Enter your username");
        const usernameInput = new UIPanel(0, 0, 15, 3, ["./textures/menu/main_menu_button_bg_0.png", "./textures/menu/main_menu_button_bg_1.png"]);
        usernameInput.addTextInput();
        usernameInput.update = () => {
            if(usernameInput.mouseHovering || usernameInput.hasFocus) {
                usernameInput.textureIndex = 1;
            } else {
                usernameInput.textureIndex = 0;
            }
        }

        const goButton = new UIPanel(0, -6, 12, 3, ["./textures/menu/begin_button_bg_0.png", "./textures/menu/begin_button_bg_1.png"])
        goButton.update = () => {
            if(goButton.mouseHovering) {
                goButton.textureIndex = 1;
            } else {
                goButton.textureIndex = 0;
            }
        }
        goButton.whenClicked = () => {
            joinLobby(usernameInput.textContent);
        }
        goButton.addText("Join");
        UILayer.push(text);
        UILayer.push(usernameInput);
        UILayer.push(goButton);
    }

    function joinLobby(username) {
        clearUIPanel();
        lobbyID ??= selection.lobbyID;
        
        Client.send({
            type:"join_lobby",
            lobbyID: lobbyID,
            username: username
        });
        
        Client.onMessage = (e) => {
            const msg = JSON.parse(e.data);

            switch(msg.type) {
                case "lobby_join_successful":
                    Client.id = msg.clientID;
                    Client.send({
                        type:"get_game_state"
                    });
                    break;
                case "lobby_users_changed":
                    Client.send({
                        type:"get_lobby_users",
                        lobbyID:lobbyID
                    });
                    break;
                case "lobby_join_unsuccessful":
                    console.log("failed to join");
                    break;
                case "lobby_users":
                    //Initiate users for each username
                    idToUser.clear(); // In case of previous values
                    for(const u of msg.users) {
                        const user = new UserObject(u.username, u.id);
                        idToUser.set(u.id, user);
                    }
                    listUsers();
                    break;
                case "game_state":
                    //Decides whether the player can join as a spectator or racer.
                    if(msg.state === "lobby_waiting") {
                        showJoinGameButton().whenClicked = () => {
                            Client.send({
                                type: "begin_race",
                                lobbyID:lobbyID,
                                trackID:0
                            });
                        };
                    } else if(msg.state === "racing") {
                        showJoinGameButton(true);
                    }
                    break;
                case "begin_race":
                    loadTrack(msg.trackID);
                    break;
            }

        }

    }

    function listUsers() {
        
        //Using the data in idToUser, draw a listing of each player username in the lobby
        clearUIPanel();
        
        const users = Array.from(idToUser.values());
        
        //create background
        const bgW = 15;
        const bgH = 15;
        const bg = new UIPanel(0, 0, bgW, bgH, ["textures/menu/lobby_players_panel.png"]);
        bg.z -= 0.1; // Move it behind player listings
        bg.recalculateVertices();
        UILayer.push(bg);
        const listingW = bgW;
        const listingH = bgH / 4; 
        for(let i = 0; i < users.length; i++) {
            const listing = new UIPanel(0, bgH/2 - listingH/2 - i*listingH, listingW, listingH, ["textures/menu/main_menu_button_bg_0.png"]);
            listing.transparent = true;
            listing.addText(users[i].username);
            UILayer.push(listing);
            
        }
        
    }

    function showJoinGameButton(spectate=false) {
        const joinButton = new UIPanel(5, -10, 11, 3, ["./textures/menu/begin_button_bg_0.png", "./textures/menu/begin_button_bg_1.png"]);
        joinButton.addText(spectate?"Spectate":"Begin race", 1.5);
        UILayer.push(joinButton);
        joinButton.update = () => {
            if(joinButton.mouseHovering) {
                joinButton.textureIndex = 1;
            } else {
                joinButton.textureIndex = 0;
            }
        }
        return joinButton;
    }

    function joinCreateLobby() {
        const joinButton = gameUI.createButton(0, 2, "Join");
        const createButton = gameUI.createButton(0, -2, "Create");
        const header = gameUI.createHeader(0, 6, "Join or create lobby");

        UILayer.push(joinButton);
        UILayer.push(createButton);
        UILayer.push(header);
        joinButton.whenClicked = () => {
            clearUI();
            Client.send({
                type:"get_lobby_listings"
            })

            Client.onMessage = (e) => {
                const msg = JSON.parse(e.data);

                switch(msg.type) {
                    case "lobby_listings":
                        displayListings(msg.lobbyListings);
                        break;   
                }
            };
        }
        createButton.whenClicked = () => {
            clearUI();
            lobbyCreationPrompt();
        }
    }

    if(Client.connected) {
        joinCreateLobby();
    } else {
        console.error("Cannot load load lobbies because no connection to server!");
    }
}