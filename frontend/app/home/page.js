"use client";
import useSocketStore from "@/store/socket";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";

import { title, subtitle } from "@/components/primitives";

export default function Home() {
    const { socket, connect } = useSocketStore();

    const [party, setParty] = useState({
        id: null,
        players: [],
        isLeader: false,
        gameStarted: false
    });
    const [waitingRoom, setWaitingRoom] = useState(true);

    useEffect(() => {
        console.log("Connecting to socket");
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
                        <div className="flex flex-col gap-8 w-full max-w-md mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="p-6 bg-default-100">
                                    <h2 className={subtitle()}>Create New Party</h2>
                                    <p className="text-default-600 mb-4">Start a new game as party leader</p>
                                    <Button
                                        color="primary"
                                        variant="shadow"
                                        size="lg"
                                        className="w-full"
                                        onClick={createParty}
                                    >
                                        Create Party
                                    </Button>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="p-6 bg-default-50">
                                    <h2 className={subtitle()}>Join Existing Party</h2>
                                    <p className="text-default-600 mb-4">Enter a party code to join</p>
                                    <Input
                                        placeholder="Enter Party ID"
                                        variant="bordered"
                                        onChange={(e) => joinParty(e.target.value)}
                                    />
                                </Card>
                            </motion.div>
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