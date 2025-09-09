import { createContext, useContext } from "react";

export type CollabPermission = "read" | "edit";

export type CollabCtx = {
  permission: CollabPermission;
  sendChange: (ops: any) => void;
  sendPresence: (p: {
    cursor?: { x: number; y: number };
    selection?: any;
  }) => void;
  peers: Record<string, any>;
};

const _noop = () => {};

export const CollabContext = createContext<CollabCtx>({
  permission: "edit",
  sendChange: _noop,
  sendPresence: _noop,
  peers: {},
});

export function useCollabContext() {
  return useContext(CollabContext);
}

export default CollabContext;
