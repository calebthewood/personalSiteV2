

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
