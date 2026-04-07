'use client';

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEffect, useState, useRef, createContext, useContext } from 'react';

type YjsTableOptions = {
  seedData?: {
    properties: any[];
    rows: any[];
  };
  currentUser?: {
    id: string;
    name?: string;
    email?: string;
  };
};

type PresenceParticipant = {
  clientId: number;
  userId: string;
  name: string;
  activity?: string;
};

// Custom hook to use Yjs with our table data
export function useYjsTable(roomName: string, options?: YjsTableOptions) {
  const [yjsInitialized, setYjsInitialized] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [participants, setParticipants] = useState<PresenceParticipant[]>([]);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Connect to WebSocket server (you'll need to set this up)
    const wsProvider = new WebsocketProvider(
      "ws://localhost:1234", // WebSocket server URL
      roomName, // Room name
      ydoc
    );
    providerRef.current = wsProvider;

    // Bind Yjs types to our data structures
    const yProperties = ydoc.getArray('properties');
    const yRows = ydoc.getArray('rows');

    const resolveName = () => {
      const explicit = options?.currentUser?.name?.trim();
      if (explicit) return explicit;
      const emailLocal = String(options?.currentUser?.email || '').split('@')[0];
      if (emailLocal) {
        return emailLocal.replace(/[._-]+/g, ' ');
      }
      return 'User';
    };

    wsProvider.awareness.setLocalStateField('user', {
      id: String(options?.currentUser?.id || 'anonymous'),
      name: resolveName(),
      email: options?.currentUser?.email || '',
    });
    wsProvider.awareness.setLocalStateField('activity', 'Viewing table');

    // Initialize from Yjs data if exists, otherwise set defaults
    const initData = () => {
      const yPropertiesArray = yProperties.toArray();
      const yRowsArray = yRows.toArray();
      
      if (yPropertiesArray.length === 0 && yRowsArray.length === 0 && options?.seedData) {
        yProperties.insert(0, options.seedData.properties);
        yRows.insert(0, options.seedData.rows);
      }
      
      setProperties(yProperties.toArray());
      setRows(yRows.toArray());
    };

    // Sync local state with Yjs changes
    const updateLocalState = () => {
      setProperties(yProperties.toArray());
      setRows(yRows.toArray());
    };

    // Observe changes in Yjs arrays
    yProperties.observe(updateLocalState);
    yRows.observe(updateLocalState);

    const updateParticipants = () => {
      const states = Array.from(wsProvider.awareness.getStates().entries());
      const next = states
        .map(([clientId, state]: [number, any]) => {
          const user = state?.user;
          if (!user) return null;
          return {
            clientId,
            userId: String(user.id || `client-${clientId}`),
            name: String(user.name || user.email || 'User'),
            activity: typeof state?.activity === 'string' ? state.activity : undefined,
          };
        })
        .filter(Boolean) as PresenceParticipant[];
      setParticipants(next);
    };

    wsProvider.awareness.on('change', updateParticipants);
    updateParticipants();

    // Initialize data
    initData();

    // Set initialized flag when connected
    const handleStatusChange = (event: { status: string }) => {
      if (event.status === 'connected' || event.status === 'synced') {
        setYjsInitialized(true);
      }
    };

    wsProvider.on('status', handleStatusChange);

    // Cleanup
    return () => {
      yProperties.unobserve(updateLocalState);
      yRows.unobserve(updateLocalState);
      wsProvider.awareness.off('change', updateParticipants);
      wsProvider.off('status', handleStatusChange);
      wsProvider.disconnect();
    };
  }, [roomName, options?.seedData, options?.currentUser?.id, options?.currentUser?.name, options?.currentUser?.email]);

  const setMyActivity = (activity: string) => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('activity', activity);
    }
  };

  const replaceProperties = (nextProperties: any[]) => {
    if (ydocRef.current) {
      const yProperties = ydocRef.current.getArray('properties');
      yProperties.delete(0, yProperties.length);
      if (nextProperties.length > 0) {
        yProperties.insert(0, nextProperties);
      }
    }
  };

  const replaceRows = (nextRows: any[]) => {
    if (ydocRef.current) {
      const yRows = ydocRef.current.getArray('rows');
      yRows.delete(0, yRows.length);
      if (nextRows.length > 0) {
        yRows.insert(0, nextRows);
      }
    }
  };

  // Functions to update data through Yjs (for optimistic updates)
  const addProperty = (property: any) => {
    if (ydocRef.current) {
      ydocRef.current.getArray('properties').push([property]);
    }
  };

  const updateProperty = (index: number, property: any) => {
    if (ydocRef.current) {
      ydocRef.current.getArray('properties').delete(index, 1);
      ydocRef.current.getArray('properties').insert(index, [property]);
    }
  };

  const deleteProperty = (index: number) => {
    if (ydocRef.current) {
      ydocRef.current.getArray('properties').delete(index, 1);
    }
  };

  const addRow = (row: any) => {
    if (ydocRef.current) {
      ydocRef.current.getArray('rows').push([row]);
    }
  };

  const updateRow = (index: number, row: any) => {
    if (ydocRef.current) {
      ydocRef.current.getArray('rows').delete(index, 1);
      ydocRef.current.getArray('rows').insert(index, [row]);
    }
  };

  const deleteRow = (index: number) => {
    if (ydocRef.current) {
      ydocRef.current.getArray('rows').delete(index, 1);
    }
  };

  return {
    yjsInitialized,
    properties,
    rows,
    addProperty,
    updateProperty,
    deleteProperty,
    addRow,
    updateRow,
    deleteRow,
    replaceProperties,
    replaceRows,
    participants,
    setMyActivity,
  };
}

// Provider component for wrapping the app
export function YjsProvider({ children, roomName }: { children: React.ReactNode; roomName: string }) {
  return (
    <YjsProviderContext.Provider value={{ roomName }}>
      {children}
    </YjsProviderContext.Provider>
  );
}

const YjsProviderContext = createContext<{ roomName: string } | undefined>(undefined);

export function useYjsRoom() {
  const context = useContext(YjsProviderContext);
  if (!context) {
    throw new Error('useYjsRoom must be used within a YjsProvider');
  }
  return context;
}