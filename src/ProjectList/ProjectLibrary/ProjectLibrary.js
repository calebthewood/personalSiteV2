import { LightsOut } from "./LightsOut";
import { GameOfLife } from "./GameOfLife";
import { Productiv } from "./Productiv";
import { Whittle } from "./Whittle";
import { AegeanCalculator } from "./AegeanCalculator";
import { RatingElement } from "./RatingElement"


export const ProjectLibrary = [
  {
    title: "Conway's Game of Life",
    id: "gameOfLife",
    description: "My implementation of Conway's Game of Life in React. It's what's called a 0-player game, or simulation. There are many iterations, but the fundamental game is based on just 3 rules, and from that all sorts of fascinating pattterns may emerge.",
    component: <GameOfLife />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/game-of-life.png",
    tags: ["JavaScript", "React"],
    url: "/gameOfLife"
  },
  {
    title: "Productiv",
    id: "productiv",
    description: "A Scandinavian themed todo app with priority settings and an inspirational quote fetcher.",
    component: <Productiv />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/Screen+Shot+2022-10-16+at+5.14.16+PM.png",
    tags: ["Local Storage", "AJAX", "React", "Rithm",],
    url: "/productiv"
  },
  {
    title: "Whittle",
    id: "whittle",
    description: "A wordle assist app that whittles down a list of potential answers based on your previous guesses.",
    component: <Whittle />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/Screen+Shot+2022-10-18+at+12.31.56+AM.png",
    tags: ["JavaScript", "React"],
    url: "/whittle"
  },
  {
    title: "Lights Out!",
    id: "lights-out",
    description: "A logic/puzzle game, played on grid of cells which can either be lit or unlit. The puzzle is won when when all of the lights are turned off.",
    component: <LightsOut />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/lights-out-react.png",
    tags: ["JavaScript", "React", "Rithm"],
    url: "/lights-out"
  },
  {
    title: "Aegean Calculator",
    id: "aegean-calculator",
    description: "Calculate the how much grain you still owe Mykonos with this handy Linear-B calculator",
    component: <AegeanCalculator />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/aegean-calculator.png",
    tags: ["JavaScript", "React"],
    url: "/aegean-calculator"
  },
  {
    title: "Five Point Rating Component",
    id: "rating-element",
    description: "Rate anything... on a scale from 1 to 5",
    component: <RatingElement />,
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/five-star-rating.png",
    tags: ["JavaScript", "React"],
    url: "/rating-element"
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