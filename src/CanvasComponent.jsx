import React, { useRef, useEffect, useState } from 'react';
import mqtt from 'paho-mqtt';

const CanvasComponent = () => {
  const canvasRef = useRef(null);
  const [beaconData, setBeaconData] = useState([]);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const gateways = {
    "Gateway 1": [0, 0],
    "Gateway 2": [5, 0],
    "Gateway 3": [2.5, 5]
  };

  // MQTT client setup
  const mqttClient = useRef(null);

  useEffect(() => {
    // Initialize MQTT client
    mqttClient.current = new mqtt.Client('ws://52.66.199.254:1883/', 'clientId-' + Math.random().toString(16).substr(2, 8));

    mqttClient.current.onConnectionLost = (responseObject) => {
      if (responseObject.errorCode !== 0) {
        console.log(`Connection lost: ${responseObject.errorMessage}`);
      }
    };

    mqttClient.current.onMessageArrived = (message) => {
      const msg = JSON.parse(message.payloadString);
      const gateway_mac = msg.gmac;
      const beacons = msg.obj;
      const updatedData = beacons.map(beacon => {
        const id = beacon.dmac;
        const position = [Math.random() * 10, Math.random() * 10]; // Replace with actual position logic

        // Calculate the zone based on the position relative to gateways
        const zone = Object.keys(gateways).find(key => {
          const [gx, gy] = gateways[key];
          const distance = Math.sqrt(Math.pow(gx - position[0], 2) + Math.pow(gy - position[1], 2));
          return distance <= 1.5; // Zone radius in meters
        }) || "Outside";

        return { id, position, zone };
      });
      setBeaconData(updatedData);
    };

    mqttClient.current.connect({ onSuccess: () => {
      console.log('Connected to MQTT broker');
      mqttClient.current.subscribe('Honda');
    }});

    return () => {
      if (mqttClient.current.isConnected()) {
        mqttClient.current.disconnect();
      }
    };
  }, []);

  const drawCanvas = (ctx, data) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Save the current transformation matrix
    ctx.save();

    // Apply scale and translation
    ctx.scale(scale, scale);
    ctx.translate(translate.x, translate.y);

    // Draw Gateways and Zones
    Object.keys(gateways).forEach((key) => {
      const [x, y] = gateways[key];
      const canvasX = x * 120.8; // scaleFactor
      const canvasY = y * 120.8; // scaleFactor

      // Draw zone circle
      ctx.fillStyle = 'rgba(255,255,255, 0.2)';
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 1.5 * 120.8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw Gateway
      const rectWidth = 30;
      const rectHeight = 50;
      ctx.fillStyle = 'white';
      ctx.fillRect(canvasX - rectWidth / 2, canvasY - rectHeight / 2, rectWidth, rectHeight);
      ctx.fillText(key, canvasX + 20, canvasY);
    });

    // Draw Beacons
    data.forEach(beacon => {
      const { id, position, zone } = beacon;
      const [x, y] = position;
      ctx.fillStyle = zone === "Zone 1" ? 'red' : zone === "Zone 2" ? 'green' : 'grey';
      ctx.beginPath();
      ctx.arc(x * 120.8, y * 120.8, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillText(id, x * 120.8 + 20, y * 120.8);
    });

    // Restore the transformation matrix to avoid affecting future drawings
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    drawCanvas(ctx, beaconData);
  }, [beaconData, scale, translate]);

  const handleWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY;
    const scaleFactor = delta > 0 ? 0.9 : 1.1; // Adjust as needed
    setScale(prevScale => prevScale * scaleFactor);
  };

  const handleMouseDown = (event) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event) => {
    if (isDragging) {
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      setTranslate(prevTranslate => ({
        x: prevTranslate.x + dx,
        y: prevTranslate.y + dy
      }));
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        marginLeft: '10px',
        borderRadius: '10px',
        backgroundColor: 'rgba(145, 21, 21, 0.4)'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    />
  );
};

export default CanvasComponent;
