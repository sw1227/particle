import React from "react";
import { useAsyncEffect } from "../../common/utility";
import Wind from "./Wind";



const WindView = () => {
  const pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);

  useAsyncEffect(async () => {
    // Draw coast line
    drawCoast();

    const canvas = document.querySelector("#canvas");
    canvas.width = canvas.clientWidth * pxRatio;
    canvas.height = canvas.clientHeight * pxRatio;
    const gl = canvas.getContext("webgl", { antialiasing: false });

    // Create wind instance and set data
    const wind = await new Wind(gl);
    wind.numParticles = 1024 * 16;
    setWindData(0, wind);

    const frame = () => {
      if (wind.windData) wind.draw();
      requestAnimationFrame(frame);
    };
    frame();
  }, []);


  const setWindData = async (name, wind) => {
    const response = await fetch(`/wind/2016112000.json`);
    if (!response.ok) throw new Error(response.statusText);

    const data = await response.json();
    const windImage = new Image();
    data.image = windImage;
    windImage.src = `/wind/2016112000.png`;
    windImage.onload = () => {
      wind.setWind(data);
    };
  };


  const drawCoast = async () => {
    const response = await fetch("https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_coastline.geojson");
    if (!response.ok) throw new Error(response.statusText);

    const data = await response.json();

    const canvas = document.getElementById("coastline");
    canvas.width = canvas.clientWidth * pxRatio;
    canvas.height = canvas.clientHeight * pxRatio;

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = pxRatio;
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.strokeStyle = "white";
    ctx.beginPath();

    data.features.forEach(feature => {
      const line = feature.geometry.coordinates;
      line.forEach((point, j) => {
        ctx[j ? "lineTo" : "moveTo"](
          (point[0] + 180) * canvas.width / 360,
          (-point[1] + 90) * canvas.height / 180
        );
      });
    });

    ctx.stroke();
  };


  return (
    <div>
      <canvas id="coastline" style={{
        background: "black",
        display: "block",
        width: "100vw",
        height: "100vh",
        position: "absolute",
      }} />
      <canvas id="canvas" style={{
        display: "block",
        width: "100vw",
        height: "100vh",
        position: "absolute",
      }} />
    </div>
  );
}

export default WindView;
