"use client";
import useSocketStore from "@/store/socket";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import MiniMap from '@/components/Minimap';
import Stopwatch from '@/components/Stopwatch';
import toast, { Toaster } from "react-hot-toast";

import { title, subtitle } from "@/components/primitives";

export default function Home() {
    const rainbowColors = [
        "#FF0000",
        "#FF7F00",
        "#FFFF00",
        "#00FF00",
        "#0000FF",
        "#4B0082",
        "#8B00FF"
    ];

    const { socket, connect } = useSocketStore();

    const [party, setParty] = useState({
        id: null,
        players: [],
        isLeader: false,
        gameStarted: false,
        seeker: null
    });
    const [amSeeker, setAmSeeker] = useState(false);
    const [waitingRoom, setWaitingRoom] = useState(true);
    const [playerCount, setPlayerCount] = useState(0);

    const [location, setLocation] = useState(null);

    const [partyPosition, setPartyPosition] = useState([]);

    const [seekerStart, setSeekerStart] = useState(null);

    useEffect(() => {
        console.log("Connecting to socket");
        connect();
    }, [connect]);

    //Decide if take state here or update from server
    useEffect(() => {
        if (!socket) return;

        const findPosition = navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log("Location updated", { latitude, longitude });
                setLocation({ latitude, longitude });
                socket.emit("updateLocation", { latitude, longitude });
            },
            (error) => {
                console.error("Error getting location", error);
            }
        );

        // Watch the device's location
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log("Location updated", { latitude, longitude });
                setLocation({ latitude, longitude });
                socket.emit("updateLocation", { latitude, longitude });
            },
            (error) => {
                console.error("Error getting location", error);
            }
        );

        // Clean up the watchPosition on unmount
        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [socket]);

    const [deviceOrientation, setDeviceOrientation] = useState(0);

    useEffect(() => {
        if (!socket) return;
        const handleOrientation = (event) => {
            // Alpha is the compass direction (0-360)
            const heading = event.alpha || 0;
            setDeviceOrientation(heading);
            //    console.log("Orientation updated", heading);
            socket.emit("updateOrientation", heading);
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [socket]);


    useEffect(() => {
        if (!socket) return;

        socket.on("partyJoined", (partyData) => {
            console.log("Party Joined", partyData);
            toast("Player joined the party", { icon: '👏', });
            setParty(prev => ({
                ...prev,
                ...partyData,
                isLeader: prev.isLeader // Keep isLeader unchanged
            }));
            setPlayerCount(partyData.players.length);
            setWaitingRoom(true);
        });

        socket.on("partyUpdated", (players) => {
            setParty(prev => ({ ...prev, players }));
        });

        socket.on("gameStarted", (data) => {
            setWaitingRoom(false);
            console.log(data)
            setAmSeeker(data.party.seeker === socket.id);
            setParty(prev => ({ ...prev, gameStarted: true }));



            setSeekerStart(location);

        });

        socket.on("positionUpdated", (data) => {
            if (!data) return;
            setPartyPosition(data);
        });

        socket.on("orientationUpdated", (data) => {
            if (!data) return;
            console.log("Orientation updated", data);
            setPartyPosition(prev => {
                return prev.map(player => {
                    const orientation = data.find(d => d.id === player.id)?.orientation;
                    return { ...player, orientation };
                });
            });
        });


        socket.on("assignLeader", () => {
            setParty(prev => ({ ...prev, isLeader: true }));
        });

        socket.on("partyCreated", (partyData) => {
            toast("Party created", { icon: '🎉', });
            setParty({
                id: partyData.partyId,
                players: [],
                isLeader: true,
                gameStarted: false
            });
            setWaitingRoom(true);
        })

        socket.on("partyDestroyed", () => {
            toast("Party destroyed", { icon: '😢', });
            setParty({
                id: null,
                players: [],
                isLeader: false,
                gameStarted: false
            });
            setWaitingRoom(true);
        })



        return () => {
            socket.off("partyJoined");
            socket.off("partyUpdated");
            socket.off("gameStart");
            socket.off("assignLeader");
            socket.off("partyCreated");
        };
    }, [socket]);



    const createParty = () => {
        //pass user data to create party
        socket?.emit("createParty", socket.id);
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
            <Toaster />
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
                            <h3>Players ({playerCount}):</h3>
                            {console.log('party.players:', party.players)}
                            {party.players.map(player => (
                                <div key={player}>{player}</div>
                            ))}
                            {party.isLeader ? (
                                <>
                                    {playerCount >= 2 ? (
                                        <motion.button
                                            onClick={startGame}
                                            className="vivid-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            Start Game
                                        </motion.button>
                                    ) : (
                                        <p className="text-red-500"> More than 2 players needed to start the game.</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-red-500">Waiting for the party leader to start the game...</p>
                            )}
                        </div>
                    )}
                </motion.div>
            ) : (
                <div className="game-screen">
                    <h1>Game Screen</h1>
                    <h2>Party ID: {party.id}</h2>
                    <h3>Players {playerCount}:</h3>
                    {party.players.map(player => (
                        <div key={player}>{player}</div>
                    ))}
                    {amSeeker && <motion.h3
                        className="text-2xl font-bold"
                        animate={{ color: rainbowColors }}
                        transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                    >
                        You are the seeker!
                    </motion.h3>}
                    <h1>NOTICE: This game is meant to be played on mobile devices. Bugs are more likely without proper location tracking.</h1>

                    <MiniMap players={partyPosition} currentPlayer={socket.id} seekerPosition={seekerStart} />
                    <Stopwatch />
                </div>
            )
            }
        </div >
    );


}