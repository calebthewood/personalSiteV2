import { Todo } from "./Todo";

/** Shows the top todo.
 *
 * Props:
 * - todos
 *
 * TodoApp -> TopTodo
 */
export function TopTodo({ todos, finishTodo }) {
  // lowest-priority # is the highest priority

  let unfinished = todos.filter((todo) => !todo.isDone);
  console.log(unfinished);
  let top = unfinished.reduce(
    (acc, cur) => (cur.priority < acc.priority ? cur : acc),
    unfinished[0]
  );

  return (
    <>{top ? <Todo todo={top} finishTodo={finishTodo} /> : <p>No todos</p>}</>
  );
}
