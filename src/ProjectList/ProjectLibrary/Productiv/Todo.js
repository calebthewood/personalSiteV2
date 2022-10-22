
/** Simple presentation component for a todo.
 *
 * Props:
 * - todo: like { id, title, description, priority }
 *
 * { EditableTodo, TopTodo } -> Todo
 **/

export function Todo({ todo, finishTodo }) {
  return (
    <div className="Todo">
      <div onClick={() => finishTodo(todo)}>
        {todo.isDone ? (
          <>
            <b>
              <s>{todo.title}</s>
            </b>
            <small>
              <span class="badge rounded-pill text-bg-light"><small>prioritet: {todo.priority}</small></span>
            </small>
          </>
        ) : (
          <>
            <b>{todo.title}</b>
            <span class="badge rounded-pill text-bg-light"><small>prioritet: {todo.priority}</small></span>
          </>
        )}
      </div>
      <div>
        <small>{todo.description}.</small>
      </div>
      <hr />
    </div>
  );
}

