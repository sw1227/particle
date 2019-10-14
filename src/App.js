import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route } from "react-router-dom";

const Hello = () => (
  <div>Hello, World!</div>
);

const AppRouter = () => (
  <Router>
    <Route path="/" exact component={Hello} />
  </Router>
);

export default AppRouter;
