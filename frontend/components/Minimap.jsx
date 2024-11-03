import styles from './Minimap.module.css'; // Adjust the import path as necessary
import { useEffect, useState } from 'react';
const MiniMap = ({ players = [], currentPlayer, seekerPosition }) => {
    const mapWidth = 500;
    const mapHeight = 500;
    const MILE_IN_FEET = 5280;
    const FIVE_MILES = MILE_IN_FEET * 5; // 5 miles in feet
    const BUFFER_FEET = FIVE_MILES; // Buffer of 5 miles
    const padding = 40; // Padding in pixels

    const [bounds, setBounds] = useState(null);

    const calculateBounds = () => {
        if (!seekerPosition && players.length === 0) return null;

        // Collect all positions including seeker's
        const allPositions = players.map(player => player.location).filter(loc => loc) || [];
        if (seekerPosition) {
            allPositions.push(seekerPosition);
        }

        // Find min and max latitudes and longitudes
        let minLat = Infinity;
        let maxLat = -Infinity;
        let minLng = Infinity;
        let maxLng = -Infinity;

        allPositions.forEach(pos => {
            if (pos.lat < minLat) minLat = pos.lat;
            if (pos.lat > maxLat) maxLat = pos.lat;
            if (pos.lng < minLng) minLng = pos.lng;
            if (pos.lng > maxLng) maxLng = pos.lng;
        });

        // Convert buffer from feet to degrees (approximation)
        const bufferDegrees = BUFFER_FEET / 364320; // 1 degree ≈ 364,320 feet

        // Expand bounds by buffer degrees
        minLat -= bufferDegrees;
        maxLat += bufferDegrees;
        minLng -= bufferDegrees;
        maxLng += bufferDegrees;

        return { minLat, maxLat, minLng, maxLng };
    };

    useEffect(() => {
        const newBounds = calculateBounds();
        setBounds(newBounds);
    }, [players, seekerPosition]);

    const latLngToPixels = (lat, lng) => {
        if (!bounds) return { x: mapWidth / 2, y: mapHeight / 2 };

        const availableWidth = mapWidth - 2 * padding;
        const availableHeight = mapHeight - 2 * padding;

        // Normalize coordinates to [0,1]
        const normalizedX = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
        const normalizedY = (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);

        // Convert to pixel coordinates with padding
        const x = padding + normalizedX * availableWidth;
        const y = padding + (1 - normalizedY) * availableHeight; // Invert Y axis

        // Clamp values to ensure they stay within the minimap
        return {
            x: Math.min(Math.max(x, padding), mapWidth - padding),
            y: Math.min(Math.max(y, padding), mapHeight - padding)
        };
    };

    return (
        <div className={styles.minimap} style={{ width: mapWidth, height: mapHeight }}>
            {/* Center reference point */}
            <div className={styles.centerPoint} />

            {players.map(player => {
                if (!player.location) return null;

                const { x, y } = latLngToPixels(player.location.lat, player.location.lng);
                const isCurrentPlayer = player.id === currentPlayer;
                const isSeeker = seekerPosition && player.id === seekerPosition.id;

                return (
                    <div
                        key={player.id}
                        className={`${styles.playerMarker} ${isCurrentPlayer ? styles.currentPlayer : ''}`}
                        style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            transform: `translate(-50%, -50%) rotate(${player.orientation || 0}deg)`
                        }}
                    >
                        <div className={styles.playerPointer} />
                        <div className={styles.playerName}>{player.name}</div>
                    </div>
                );
            })}
        </div>
    );
};


export default MiniMap;