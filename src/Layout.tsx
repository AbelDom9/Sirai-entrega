import type { ReactNode } from "react";
import { Layout as RALayout, CheckForApplicationUpdate } from "react-admin";
import { Menu } from "./Menu";
import { BarraSuperior } from "./BarraSuperior";

export const Layout = ({ children }: { children: ReactNode }) => (
  // NUEVO: menu reemplaza el menú predeterminado por el que incluye nuestras rutas.
  <RALayout menu={Menu} appBar={BarraSuperior}>
    {children}
    <CheckForApplicationUpdate />
  </RALayout>
);
