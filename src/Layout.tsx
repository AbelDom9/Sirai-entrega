import type { ReactNode } from "react";
import { Layout as RALayout, CheckForApplicationUpdate } from "react-admin";
import { Menu } from "./Menu";

export const Layout = ({ children }: { children: ReactNode }) => (
  // NUEVO: menu reemplaza el menú predeterminado por el que incluye nuestras rutas.
  <RALayout menu={Menu}>
    {children}
    <CheckForApplicationUpdate />
  </RALayout>
);
