import { createContext, useContext } from "react";

export interface ShellApi {
  openLearn: (tab?: "start" | "videos") => void;
  openCommand: () => void;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
}

export const ShellContext = createContext<ShellApi>({
  openLearn: () => {},
  openCommand: () => {},
  minimized: false,
  setMinimized: () => {},
});

export const useShell = () => useContext(ShellContext);
