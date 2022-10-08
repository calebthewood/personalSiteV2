

export function dateToNum(date) {
  let numString = "";
  for (let char of date) {
    if (isNumber(char)) numString += char;
  }
  return Number(numString);
}

function isNumber(char) {
  return /^\d$/.test(char);
}

export function getResourceFromPath(path) {
  let output = "";
  for (let i = 1; i < path.length; i++) {
    if (path[i] === "/") return output;
    output += path[i];
  }
  return output;
}