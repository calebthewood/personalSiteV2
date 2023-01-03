

export function dateToNum(date) {
  let numString = "";
  for (let char of date) {
    if (isNumber(char)) numString += char;
  }
  return Number(numString);
}

export function sortDates(a, b) {
  const dateA = new Date(a.date);
  const dateB = new Date(b.date);
  if (dateA > dateB) return -1;
  if (dateA < dateB) return 1;
  return 0;
}

function isNumber(char) {
  // /^\d$/.test(char)
  return "0123456789".includes(char);
}

export function getResourceFromPath(path) {
  let output = "";
  for (let i = 1; i < path.length; i++) {
    if (path[i] === "/") return output;
    output += path[i];
  }
  return output;
}