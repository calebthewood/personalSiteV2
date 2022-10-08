
/** Accepts the Annotations Object from a Notion Page Object, and
 * an array containing any existing class names, and returns a class
 * list string including type annotations and color
 */
export function classListFromAnnotations(annotations, classList = []) {
  Object.keys(annotations).forEach(type => {
    if (annotations[type] && type !== 'color') classList.push(type);
  });
  return classList.join(" ")
}

