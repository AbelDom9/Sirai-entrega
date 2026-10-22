// Este código inicializa la aplicación de React y la conecta
// con el elemento raíz del DOM. Se utiliza React.StrictMode para 
// ayudar a detectar problemas potenciales en la aplicación durante el desarrollo 

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
