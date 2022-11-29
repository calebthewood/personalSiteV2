import { LightsOut } from "./LightsOut";
import { GameOfLife } from "./GameOfLife";
import { Productiv } from "./Productiv";
import { Whittle } from "./Whittle";
import { AegeanCalculator } from "./AegeanCalculator";


export const ProjectLibrary = [
  {
    title: "Conway's Game of Life",
    id: "gameOfLife",
    description: "My version of Conway's Game of Life in React. It includes a control panel to play, pause, +/- speed, reset to default, clear screen, and nine premade patterns you can place yourself.",
    component: <GameOfLife />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/game-of-life.png",
    tags: ["JavaScript", "React"],
    url: "/gameOfLife"
  },
  {
    title: "Productiv",
    id: "productiv",
    description: "A Scandinavian themed todo app with priority settings and an inspirational quote fetcher. ",
    component: <Productiv />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/Screen+Shot+2022-10-16+at+5.14.16+PM.png",
    tags: ["Local Storage", "AJAX", "React", "Rithm",],
    url: "/productiv"
  },
  {
    title: "Whittle",
    id: "whittle",
    description: "A wordle assist app that whittles down a list of potential answers based on your previous guesses. This was the first app I ever deployed, and I've rebuilt it here in React. Please note that this is currently unplayable on mobile.",
    component: <Whittle />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/Screen+Shot+2022-10-18+at+12.31.56+AM.png",
    tags: ["JavaScript", "React"],
    url: "/whittle"
  },
  {
    title: "Lights Out!",
    id: "lights-out",
    description: "Lights Out! is a logic/puzzle game, played on grid of individual lights, which can either be lit or unlit. The puzzle is won when when all of the lights are turned off.",
    component: <LightsOut />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/lights-out-react.png",
    tags: ["JavaScript", "React", "Rithm"],
    url: "/lights-out"
  },
  {
    title: "Aegean Calculator",
    id: "aegean-calculator",
    description: "Calculate the how much grain you still owe Mykonos.",
    component: <AegeanCalculator />,
    img: "",
    tags: [],
    url: "/aegean-calculator"
  },
  {
    title: "Future Projects",
    id: "",
    description: "Expect to see new React projects pop-up here from time to time. Some items on the horizon include a small 2d game, a pixel art editor, and some data visualizations.",
    component: "",
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/logo192.png",
    tags: [],
    url: "/"
  },
];