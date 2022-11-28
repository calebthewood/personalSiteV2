import "AegeanCaluculator.css";
import { useState } from "react";

export default function AegeanCaluculator() {

  return (
    <div className="calculator">
      <div className="display">
        <span ></span>
      </div>
      <div className="buttons">
        <div className="row calc-btns">
          <button>AC</button>
          <button>+/-</button>
          <button>%</button>
          <button>/</button>
        </div>
        <div className="row calc-btns">
          <button>7</button>
          <button>8</button>
          <button>9</button>
          <button>x</button>
        </div>
        <div className="row calc-btns">
          <button>4</button>
          <button>5</button>
          <button>6</button>
          <button>-</button>
        </div>
        <div className="row calc-btns">
          <button>1</button>
          <button>2</button>
          <button>3</button>
          <button>+</button>
        </div>
        <div className="row calc-btns">
          <button className="calc-0">0</button>
          <button>.</button>
          <button>=</button>
        </div>
      </div>
    </div>
  );
}