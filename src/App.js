import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route } from "react-router-dom";
import SimpleWebGL from "./views/SimpleWebGL";
import Render from "./views/Refactor/Render";

const Hello = () => (
  <div>Hello, World!</div>
);

const AppRouter = () => (
  <Router>
    <Route path="/" exact component={Hello} />
    <Route path="/simple" exact component={SimpleWebGL} />
    <Route path="/render" exact component={Render} />
  </Router>
);


export default AppRouter;
