import React, { useState } from "react";
import Todo from "./Todo";
import TodoForm from "./TodoForm";

/** Show editable todo item.
 *
 * Props
 * - todo
 * - update(): fn to call to update a todo
 * - remove(): fn to call to remove a todo
 *
 * EditableTodoList -> EditableTodo -> { Todo, TodoForm }
 */

function EditableTodo({ todo, remove, update, finishTodo }) {
  const [formShowing, setFormShowing] = useState(false);
  /** Toggle if this is being edited */
  function toggleEdit() {
    setFormShowing((formShowing) => !formShowing);
  }

  /** Call remove fn passed to this. */
  function handleDelete() {
    remove(todo.id);
  }

  /** Edit form saved; toggle isEditing and update in ancestor. */
  function handleSave(formData) {
    formData.id = todo.id;
    update(formData);
    setFormShowing(false);
  }

  return (
    <div className="EditableTodo">
      {formShowing ? (
        <TodoForm initialValues={todo} handleSave={handleSave} />
      ) : (
        <div className="mb-3">
          <div className="float-end text-sm-end">
            <button
              className="EditableTodo-toggle btn-link btn btn-sm"
              onClick={toggleEdit}
            >
              Edit
            </button>
            <button
              className="EditableTodo-delBtn btn-link btn btn-sm text-danger"
              onClick={handleDelete}
            >
              Del
            </button>
          </div>
          <Todo todo={todo} finishTodo={finishTodo} />
        </div>
      )}
    </div>
  );
}

export default EditableTodo;
