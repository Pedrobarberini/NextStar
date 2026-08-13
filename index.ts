import { registerRootComponent } from "expo";
import React from "react";
import App from "./App";
import { ThemeProvider } from "./src/ThemeProvider";

function Root() {
  return React.createElement(
    ThemeProvider,
    null,
    React.createElement(App)
  );
}

registerRootComponent(Root);
