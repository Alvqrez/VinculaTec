import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const WebSocketCtx = createContext(null);

// Configuración del cliente WebSocket
const socket = io("http://0.0.0.0:3001", {
  autoConnect: false,
  withCredentials: true,
});

export function WebSocketProvider({ children }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Conectar al servidor WebSocket
    socket.connect();

    socket.on("connect", () => {
      console.log("[WebSocket] Conectado al servidor");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Desconectado del servidor");
      setConnected(false);
    });

    // Escuchar evento de reporte actualizado
    socket.on("reporte_actualizado", (data) => {
      console.log("[WebSocket] Reporte actualizado:", data);
      // Aquí se puede disparar una actualización del estado global
      // Por ejemplo, recargar los reportes o actualizar el contexto correspondiente
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <WebSocketCtx.Provider value={{ socket, connected }}>
      {children}
    </WebSocketCtx.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketCtx);
}
