import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface DocumentChange {
  type: 'nodes' | 'edges' | 'sheet_update' | 'sheet_create' | 'sheet_delete' | 'sheet_reorder' | 'snapshot';
  data: any;
  userId: string;
  timestamp: number;
  sheetId?: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  users: User[];
  currentUser: User | null;
  joinDocument: (documentId: string, token?: string) => void;
  leaveDocument: () => void;
  sendChange: (change: Omit<DocumentChange, 'userId' | 'timestamp'>) => void;
  onDocumentChange: (callback: (change: DocumentChange) => void) => () => void;
  onUserJoin: (callback: (user: User) => void) => () => void;
  onUserLeave: (callback: (userId: string) => void) => () => void;
  updateCursor: (x: number, y: number) => void;
  reconnect: () => void;
  lastError: string | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

const USER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#F97316', '#EC4899', '#84CC16', '#6366F1'
];

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const changeCallbacks = useRef<Set<(change: DocumentChange) => void>>(new Set());
  const userJoinCallbacks = useRef<Set<(user: User) => void>>(new Set());
  const userLeaveCallbacks = useRef<Set<(userId: string) => void>>(new Set());

  const changeQueue = useRef<DocumentChange[]>([]);
  const flushTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorThrottle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (flushTimeout.current) {
      clearTimeout(flushTimeout.current);
      flushTimeout.current = null;
    }
    if (cursorThrottle.current) {
      clearTimeout(cursorThrottle.current);
      cursorThrottle.current = null;
    }
    changeQueue.current = [];
  }, []);

  const initializeSocket = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }

    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    
    console.log('Initializing WebSocket connection to:', backendUrl);
    setConnectionStatus('connecting');
    setLastError(null);

    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    const userId = uuidv4();
    const userName = `Usuario ${userId.slice(0, 8)}`;
    const userColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

    const user: User = {
      id: userId,
      name: userName,
      color: userColor,
    };

    setCurrentUser(user);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setConnectionStatus('connected');
      setLastError(null);

      if (documentId) {
        console.log('Re-joining document after reconnection:', documentId);
        newSocket.emit('join_document', { 
          documentId, 
          user,
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server. Reason:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setUsers([]);
      
      if (reason === 'io server disconnect') {
        console.log('Server initiated disconnect, attempting to reconnect...');
        setTimeout(() => newSocket.connect(), 1000);
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to WebSocket server after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
      setLastError(null);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt', attemptNumber);
      setConnectionStatus('connecting');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      setConnectionStatus('error');
      setLastError(`Reconnection failed: ${error.message}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after maximum attempts');
      setConnectionStatus('error');
      setLastError('Failed to reconnect to server');
    });

    newSocket.on('document_change', (change: DocumentChange) => {
      console.log('WebSocket received document_change:', change);
      
      if (change.userId !== user.id) {
        changeCallbacks.current.forEach(callback => {
          try {
            callback(change);
          } catch (error) {
            console.error('Error in change callback:', error);
          }
        });
      }
    });

    newSocket.on('user_joined', (joinedUser: User) => {
      console.log('User joined:', joinedUser);
      if (joinedUser.id !== user.id) {
        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== joinedUser.id);
          return [...filtered, joinedUser];
        });
        userJoinCallbacks.current.forEach(callback => {
          try {
            callback(joinedUser);
          } catch (error) {
            console.error('Error in user join callback:', error);
          }
        });
      }
    });

    newSocket.on('user_left', (userId: string) => {
      console.log('User left:', userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      userLeaveCallbacks.current.forEach(callback => {
        try {
          callback(userId);
        } catch (error) {
          console.error('Error in user leave callback:', error);
        }
      });
    });

    newSocket.on('users_list', (usersList: User[]) => {
      console.log('Users list updated:', usersList);
      setUsers(usersList.filter(u => u.id !== user.id));
    });

    newSocket.on('user_cursor', ({ userId, cursor }: { userId: string; cursor: { x: number; y: number } }) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, cursor } : u));
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
      setLastError(`Connection error: ${error.message}`);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setLastError(`Socket error: ${error}`);
    });

    return newSocket;
  }, [documentId]);

  useEffect(() => {
    const newSocket = initializeSocket();
    
    return () => {
      cleanup();
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  const joinDocument = useCallback((docId: string, token?: string) => {
    if (socket && currentUser && isConnected) {
      console.log('Joining document:', docId, 'with token:', !!token);
      setDocumentId(docId);
      socket.emit('join_document', { 
        documentId: docId, 
        user: currentUser,
        token 
      });
    } else {
      console.warn('Cannot join document: WebSocket not ready', {
        hasSocket: !!socket,
        hasUser: !!currentUser,
        isConnected
      });
      setLastError('Cannot join document: Connection not ready');
    }
  }, [socket, currentUser, isConnected]);

  const leaveDocument = useCallback(() => {
    if (socket && documentId) {
      console.log('Leaving document:', documentId);
      socket.emit('leave_document', { documentId });
      setDocumentId(null);
      setUsers([]);
    }
  }, [socket, documentId]);

  // Flush queued changes
  const flushChanges = useCallback(() => {
    if (changeQueue.current.length === 0 || !socket || !documentId || !currentUser || !isConnected) {
      return;
    }

    // Enviar el último cambio de cada tipo
    const latestChanges = new Map<string, DocumentChange>();
    changeQueue.current.forEach(change => {
      const key = `${change.type}-${change.sheetId || 'main'}`;
      latestChanges.set(key, change);
    });

    latestChanges.forEach(change => {
      console.log('Sending queued change via WebSocket:', change);
      socket.emit('document_change', { documentId, change });
    });

    changeQueue.current = [];
    flushTimeout.current = null;
  }, [socket, documentId, currentUser, isConnected]);

  const sendChange = useCallback((change: Omit<DocumentChange, 'userId' | 'timestamp'>) => {
    if (!socket || !documentId || !currentUser || !isConnected) {
      console.warn('⚠️ Cannot send change: WebSocket not ready', {
        hasSocket: !!socket,
        hasDocumentId: !!documentId,
        hasUser: !!currentUser,
        isConnected
      });
      setLastError('Cannot send change: Connection not ready');
      return;
    }

    const fullChange: DocumentChange = {
      ...change,
      userId: currentUser.id,
      timestamp: Date.now(),
    };

    // Agregar a la cola
    changeQueue.current.push(fullChange);

    // Cancelar timeout anterior si existe
    if (flushTimeout.current) {
      clearTimeout(flushTimeout.current);
    }

    // Crear nuevo timeout para flush
    flushTimeout.current = setTimeout(flushChanges, 100);
  }, [socket, documentId, currentUser, isConnected, flushChanges]);

  const onDocumentChange = useCallback((callback: (change: DocumentChange) => void) => {
    changeCallbacks.current.add(callback);
    return () => {
      changeCallbacks.current.delete(callback);
    };
  }, []);

  const onUserJoin = useCallback((callback: (user: User) => void) => {
    userJoinCallbacks.current.add(callback);
    return () => {
      userJoinCallbacks.current.delete(callback);
    };
  }, []);

  const onUserLeave = useCallback((callback: (userId: string) => void) => {
    userLeaveCallbacks.current.add(callback);
    return () => {
      userLeaveCallbacks.current.delete(callback);
    };
  }, []);

  const updateCursor = useCallback((x: number, y: number) => {
    if (!socket || !documentId || !currentUser || !isConnected) {
      return;
    }

    if (cursorThrottle.current) {
      return;
    }

    cursorThrottle.current = setTimeout(() => {
      if (socket && documentId && currentUser && isConnected) {
        socket.emit('cursor_update', { 
          documentId, 
          userId: currentUser.id, 
          cursor: { x, y } 
        });
      }
      cursorThrottle.current = null;
    }, 16); 
  }, [socket, documentId, currentUser, isConnected]);

  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection initiated');
    setLastError(null);
    initializeSocket();
  }, [initializeSocket]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    users,
    currentUser,
    joinDocument,
    leaveDocument,
    sendChange,
    onDocumentChange,
    onUserJoin,
    onUserLeave,
    updateCursor,
    reconnect,
    lastError,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}