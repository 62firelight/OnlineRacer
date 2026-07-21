import {server} from "./server_lobbies.js";
import {lobbyMessage, lobbyDisconnect} from "./on_lobby_message.js"

const DEBUG = false;

export function createSendShorthand(socket) {
    return (msg, s=socket) => {
        //Shorter way of typing this
        if(DEBUG) {
            console.log(`sent back:\n${JSON.stringify(msg)}`);
        }
        s.send(JSON.stringify(msg));
    }
}


export function createSendLobbyShorthand(s) {
    const sendBack = createSendShorthand(s);
    return (msg, {socket=s, includeSelf=true}={}) => {
        //Sends to all other players in the lobby (unless includeSelf is set to false)
        
        //First get lobby object
        const lobbyObject = server.lobbies.get(server.socketToLobbyID.get(socket));
        //Now send to all players in lobby  
        
        for(const s of lobbyObject.socketToClientID.keys()) {
            if(!includeSelf && s == socket) continue;
            sendBack(msg, s);
        }
    }
}

export function clientWebSocketMessage(msg) {
    const timeArrival = performance.now();
    
    const sendBack = createSendShorthand(this);

    const sendLobby = createSendLobbyShorthand(this);

    if(DEBUG) {
        console.log(`recieved:\n${JSON.stringify(msg)}`);
    }

    switch(msg.type) {

        case "time_sync":
            sendBack({
                type: "time_sync_response",
                t1: timeArrival,
                t2: performance.now(),
            });
            break;

        case "get_lobby_listings":
            sendBack({
                type: "lobby_listings",
                lobbyListings: server.getLobbyListings()
            })
            break;


        case "join_lobby":{
            //Get lobby object
            
            const lobby = server.lobbies.get(msg.lobbyID);
            if(lobby) {
                if(lobby.checkServerFull()) {
                    sendBack({
                        type: "lobby_join_unsuccessful",
                        reason: "lobby_full"
                    })
                } else {
                    if(lobby.checkUsernameAvailable(msg.username)) {
                        const cID = lobby.enlistPlayer(msg.username, this);
                        
                        sendLobby({
                            type:"lobby_users_changed"
                        });
                        sendBack({
                            type: "lobby_join_successful",
                            clientID: cID
                        });
                    } else {
                        sendBack({
                            type: "lobby_join_unsuccessful",
                            reason: "username_taken"
                        })
                    }
                }
            } else {
                sendBack({
                    type: "lobby_join_unsuccessful",
                    reason: "lobby_id_invalid"
                })
            }
            break;
        }

        case "player_disconnected": {
            
            if(server.socketToLobbyID.get(this) !== undefined) {
                const lobbyObject = server.lobbies.get(server.socketToLobbyID.get(this));
                //remove player from lobby
                //Indicate to all players in lobby that the lobby users has changed
                sendLobby({
                        type:"lobby_users_changed"
                });
                lobbyDisconnect.call(this);
                lobbyObject.removePlayer(this);
            }
            break;
        }
    }

    if(server.socketToLobbyID.get(this) !== undefined) { // only if player is in a lobby
        lobbyMessage.call(this, msg); // Pass onto lobby handler 
    }
}
