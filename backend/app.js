const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const port = 3001;

// Create an HTTP server
const server = http.createServer(app);

// Initialize socket.io with the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const allParties = {};
const allPlayers = {};


function generatePartyId() {
  //generate an easy to remember party ID
  let id = Math.random().toString(36).substring(2, 5).toUpperCase();

  if (allParties[id]) {
    return generatePartyId();
  }
  return id;
}


// Add socket.io event listeners
io.on('connection', (socket) => {
  console.log('New client connected');


  //TODO maybe add a stack implementation for back tracking
  socket.on("updateLocation", (data) => {
    allPlayers[socket.id] = {
      ...allPlayers[socket.id],
      ...data,
      lastUpdate: Date.now()
    };
    console.log("LINE 47: " + allPlayers[socket.id])

    //find all players on team
    const partyId = Object.keys(allParties).find(partyId => allParties[partyId].players.includes(socket.id));
    if (!partyId) return
    const party = allParties[partyId];
    if (!party) return;
    const players = party.players;

    //if either lat or long is null, return
    if (data.latitude === null || data.longitude === null) return;

    console.log(allPlayers[socket.id])


    io.to(partyId).emit('positionUpdated', players.map(player => {
      return {
        id: player,
        location: { lat: allPlayers[player]?.latitude || 1, lng: allPlayers[player]?.longitude || 1 }
      }
    }));
  })

  socket.on("updateOrientation", (data) => {
    allPlayers[socket.id] = {
      ...allPlayers[socket.id],
      orientation: data,
      lastUpdate: Date.now()
    };

    //find all players on team
    const partyId = Object.keys(allParties).find(partyId => allParties[partyId].players.includes(socket.id));
    if (!partyId) return
    const party = allParties[partyId];
    if (!party) return;
    const players = party.players;


    io.to(partyId).emit('orientationUpdated', players.map(player => {
      return {
        id: player,
        orientation: allPlayers[player]?.orientation || 1
      }

    }));
  })

  // Listener for 'joinParty' event
  socket.on('joinParty', (partyId) => {
    if (!allParties[partyId]) {
      return;
    }
    console.log(`Client joined party with ID: ${partyId}`);

    // Add the player to the party
    allParties[partyId].players.push(socket.id);

    // Handle the event (e.g., join the party room)
    socket.join(partyId);
    io.to(partyId).emit('partyJoined', {
      id: partyId,
      players: allParties[partyId].players,
      gameStarted: false
    });
  });

  // Listener for 'createParty' event
  socket.on('createParty', (partyData) => {
    console.log(`Party created with data: ${JSON.stringify(partyData)}`);
    // Handle the event (e.g., create a new party)
    const partyId = generatePartyId(); // Implement this function to generate a unique party ID
    socket.join(partyId);
    socket.emit('partyCreated', { partyId });
    allParties[partyId] = {
      partyId: partyId, players: [partyData], leader: socket.id, gameStarted: false, seeker: null
    }

  });

  // Listener for 'startGame' event
  socket.on('startGame', (partyId) => {
    console.log(`Game started for party with ID: ${partyId}`);

    //randomly select a seeker
    const party = allParties[partyId];
    const players = party.players;
    const seekerIndex = Math.floor(Math.random() * players.length);
    party.seeker = players[seekerIndex];

    console.log(`Seeker is ${party.seeker}`);

    // Handle the event (e.g., start the game for the party)
    io.to(partyId).emit('gameStarted', { party });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');

    // Remove the player from all parties
    for (const partyId in allParties) {
      const party = allParties[partyId];

      if (party.leader === socket.id) {
        delete allParties[partyId];
        io.to(partyId).emit('partyDestroyed');
        continue;
      }

      const playerIndex = party.players.indexOf(socket.id);
      if (playerIndex > -1) {
        party.players.splice(playerIndex, 1);
        io.to(partyId).emit('partyUpdated', party.players);
      }
    }




  });
});

// Start the server
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});