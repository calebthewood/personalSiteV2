import TodoApp from "./TodoApp";
import "./productiv.css";
import QuoteApp from "./QuoteApp";

/** Productiv application.
 *
 * Productiv -> TodoApp, QuoteApp
 **/

export default function Productiv() {
  return (
    <main className="productiv">
      <header className="container-fluid pt-4 pb-1">
        <div className="container">
          <h1>Prøductïv</h1>
          <p className="lead">The best name in todo list management.</p>
        </div>
        <QuoteApp className="container" />
      </header>

      <section className="container mt-4">
        <TodoApp
          initialTodos={[
            {
              id: 1,
              title: "Code!",
              description: "Write all the codes",
              priority: 2,
            },
            {
              id: 2,
              title: "Make dinner",
              description: "Cook something healthy",
              priority: 1,
            },
            {
              id: 3,
              title: "Go to bed",
              description: "In bed by 11:15",
              priority: 3,
            },
          ]}
        />
      </section>
    </main>
  );
}

