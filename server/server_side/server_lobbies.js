let nextAvailableLobbyID = 0;

const MAX_PLAYERS_PER_LOBBY = 4;

function LobbyObject(name, lobbyID) {
    this.name = name;
    this.lobbyID = lobbyID;
    this.playersCount = 0;
    this.nextAvailableClientID = 1;
    this.playerUsernames = new Map(); // Maps client id to usernames
    this.socketToClientID = new Map(); // Maps websockets to client ids
    this.clientIDToSocket = new Map(); // Reverse mapping
    this.state = "lobby_waiting";
    this.checkServerFull = function () {
        return this.playersCount >= MAX_PLAYERS_PER_LOBBY;
    }
    this.checkUsernameAvailable = function(username) {
        //Returns true if username is unique among lobby
        const usernames = this.playerUsernames.values();

        for(const u of usernames) {
            if(u === username) {
                return false;
            }
        }

        return true;
    }
    this.enlistPlayer = function(username, socket) {
        // Sets up the player records in the lobby and returns the client ID
        this.socketToClientID.set(socket, this.nextAvailableClientID);
        this.clientIDToSocket.set(this.nextAvailableClientID, socket);
        this.playerUsernames.set(this.nextAvailableClientID, username);
        this.playersCount++;
        server.socketToLobbyID.set(socket, this.lobbyID); //TODO: come up with a fix. Cannot reference server this way as it is exported.
        //Probably just bind lobby object
        return this.nextAvailableClientID++;
    }
    this.removePlayer = function(socket) {
        //removes the player with associated with the socket from the lobby
        const cID = this.socketToClientID.get(socket);
        this.socketToClientID.delete(socket);
        this.clientIDToSocket.delete(cID);
        this.playerUsernames.delete(cID);
        this.playersCount--;
        server.socketToLobbyID.delete(socket);
    }
}

export const server = {
    lobbies: new Map(), //Maps lobby ID to lobby object
    socketToLobbyID: new Map(),
    createLobby:function(name) {
        //Creates a new lobby with the next available lobby ID and returns the ID
        this.lobbies.set(nextAvailableLobbyID, new LobbyObject(name, nextAvailableLobbyID));
        return nextAvailableLobbyID++;
    },
    getLobbyListings:function() {
        /* returns array of the lobby information in the form of 
    {name, playersCount, lobbyID}*/
        const lobbyObjects = this.lobbies.values();

        const listings = [];

        for(const lobbyObject of lobbyObjects) {
            listings.push({
                name:lobbyObject.name,
                playersCount: lobbyObject.playersCount,
                lobbyID:lobbyObject.lobbyID
            })
        }
        
        return listings;

    },

};

server.createLobby("testlobby");