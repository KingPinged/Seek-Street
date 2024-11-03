"use client";
import useSocketStore from "@/store/socket";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
    const { socket, connect } = useSocketStore();

    const [party, setParty] = useState({
        id: null,
        players: [],
        gameStarted: false
    });
    const [waitingRoom, setWaitingRoom] = useState(true);

    useEffect(() => {
        connect();
    }, [connect]);

    useEffect(() => {
        if (!socket) return;

        socket.on("partyJoined", (partyData) => {
            setParty(partyData);
            setWaitingRoom(true);
        });

        socket.on("partyUpdated", (players) => {
            setParty(prev => ({ ...prev, players }));
        });

        socket.on("gameStart", () => {
            setWaitingRoom(false);
            setParty(prev => ({ ...prev, gameStarted: true }));
        });

        socket.on("assignLeader", () => {
            setParty(prev => ({ ...prev, isLeader: true }));
        });



        return () => {
            socket.off("partyJoined");
            socket.off("partyUpdated");
            socket.off("gameStart");
            socket.off("assignLeader");
        };
    }, [socket]);



    const createParty = () => {
        socket?.emit("createParty");
    };

    const joinParty = (partyId) => {
        socket?.emit("joinParty", partyId);
    };

    const startGame = () => {
        if (party.isLeader) {
            socket?.emit("startGame", party.id);
        }
    };

    return (
        <div>
            {waitingRoom ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="waiting-room"
                >
                    {!party.id ? (
                        <div>
                            <button onClick={createParty}>Create Party</button>
                            <input
                                placeholder="Enter Party ID"
                                onChange={(e) => joinParty(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div>
                            <h2>Party ID: {party.id}</h2>
                            <h3>Players ({party.players.length}):</h3>
                            {party.players.map(player => (
                                <div key={player.id}>{player.name}</div>
                            ))}
                            {party.isLeader && (
                                <button onClick={startGame}>Start Game</button>
                            )}
                        </div>
                    )}
                </motion.div>
            ) : (
                <div className="game-screen">
                    {/* Game UI goes here */}
                </div>
            )}
        </div>
    );


}