import Board from "./LightsOut/Board";
import GameOfLife from "./GameOfLife/GameOfLife";


export const ProjectLibrary = [
  {
    title: "Lights Out",
    id: "lights-out",
    description: "Lights Out is a logic/puzzle game, played on a gird of individual lights, which can either be lit or unlit. The puzzle is won when when all of the lights are turned off.",
    component: <Board />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/lights-out-react.png",
    tags: ["JavaScript", "React"],
    url: "/lights-out"
  },
  {
    title: "Conway's Game of Life",
    id: "gameOfLife",
    description: "My implementation of Conway's Game of Life in React. Originally I did this in plain JavaScript while working through the book, Eloquent JavaScript.",
    component: <GameOfLife />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/Screen+Shot+2022-10-15+at+6.02.49+PM.png",
    tags: ["JavaScript", "React"],
    url: "/gameOfLife"
  },
  {
    title: "Game of Life",
    id: "gameOfLife",
    description: "My own implementation of Conway's Game of Life. It simulates an infinite field by wrapping both horizontal and vertical edges.",
    component: "<CanvasGame />",
    img: null,
    tags: ["JavaScript", "React"],
    url: "/gameOfLife"
  },
  {
    title: "Pixel Paint Editor",
    id: "pixelPaintEditor",
    description: "A simple drawing program coded entirely in JavaScript. Draw or edit pixel images. Features saving, loading, and hotkeys.",
    component: "<CanvasGame />",
    img: null,
    tags: ["JavaScript", "React"],
    url: "/pixelPaintEditor"
  },
];