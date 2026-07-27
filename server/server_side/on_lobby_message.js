import { createSendShorthand, createSendLobbyShorthand } from "./on_message.js";
import { server } from "./server_lobbies.js";

export function lobbyMessage(msg) {
    const sendBack = createSendShorthand(this);
    const sendLobby = createSendLobbyShorthand(this);
    //Handles lobby messages.
    const lID = server.socketToLobbyID.get(this);
    
    switch(msg.type) {
        case "get_lobby_users": {
            //get lobby object
            const lobby = server.lobbies.get(lID);
            const users = [];
            
            for(const [id, username] of lobby.playerUsernames) {
                users.push({
                    id: id,
                    username:username
                });
            }
            sendBack({
                type: "lobby_users",
                users:users
            });
            break;
        }

        case "get_game_state":
            //Return game state
            
            sendBack({
                type:"game_state",
                state:server.lobbies.get(lID).state
            })
            break;

        case "begin_race":
            //Set lobby state to racing
            server.lobbies.get(lID).state = "racing";
            sendLobby({
                type:"begin_race",
                trackID:msg.trackID
            });

            break;
        
        // Below is for compatability with old netcode
        case "get_car_states":
            sendLobby(msg, {includeSelf:false});
            break;
        case "add_car":
            const returnSocket = server.lobbies.get(lID).clientIDToSocket.get(msg.destinationId);
            sendBack(msg, returnSocket);
            break;
        case "get_lobby_size":
            const lobbySize = server.lobbies.get(lID).playersCount;
            sendBack({type:"lobby_size", size:lobbySize});
            break;
        case "player_ready":
            sendLobby({type:"player_ready"}, {includeSelf:false});
            break;
        case "car_update":
            sendLobby(msg, {includeSelf:false});
            break;
        case "relay_all":
            sendLobby(msg.relay);
            break
        case "relay_others":
            sendLobby(msg.relay, {includeSelf:false});
            break;
    }

}

export function lobbyDisconnect() {
        //Below is for compatability with the old netcode.
        const lID = server.socketToLobbyID.get(this);
        const id = server.lobbies.get(lID).socketToClientID.get(this);
        const sendLobby = createSendLobbyShorthand(this);
        sendLobby({type:"lobby_update_player_disconnected", id:id});
}
