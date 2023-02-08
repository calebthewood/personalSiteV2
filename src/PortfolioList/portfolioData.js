import { isContentEditable } from "@testing-library/user-event/dist/utils";


export const portfolio = [
  {
    title: "This site",
    id: "personalSite",
    summary:
    "This site is the second iteration of my personal website, and I've added quite a lot! This 'Portfolio' section contains info on each of my full stack projects currently hosted on the web. The 'Project' library showcases some amusing frontend projects, the blog incorporates the NotionSDK, and I've added a small Dashboard with realtime metric information.",
    frontend: [
      "React JS with Hooks",
      "Landing page features a dodecahedron rendered with three.js",
      "'Blog' converts JSON page objects from NotionSDK jsx",
      "'Projects' features mini-react apps and toy programs",
      "Navigation handled via React-Router-Dom",
      "Dashboard displays metrics and chart drawn with HTML canvas",
      "Styles and layout implemented with Bootstrap 5.2",
    ],
    backend: [
      "Node-Express Server",
      "Notion SDK integration allows me to publish from my desktop",
      "Wrote a class to parse Notion's 'Page Objects' before uploading to db",
      "Integrated Twitter API to embed my programming related tweets",
      "Developed my own fullstack system for measuring site metrics",
      "Metrics system tracks unique visitor count, user path, and page visits",
    ],
    database: [
      "AWS S3 and MongoDB Atlas Databases",
      "Image files and resume stored in AWS S3 bucket",
      "Blog posts and metrics data stored in MongoDB Atlas",
      "Interface with MongoDB using MongoClient",
    ],
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/personal-site-square.png"
  },
  {
    title: "Jobly",
    id: "jobly",
    summary: "Jobly is a fullstack job-board web app featuring a ReactJS frontend, NodeJS REST API backend, and PostgreSQL database containing mock data. It is deployed on Heroku and Surge. In December I succesully migrated the database from a Heroku Hobby dyno to AWS RDS.",
    frontend: [
      "React Frontend",
      "Client side routing with React-Router-Dom",
      "Route authentication and authorization using JSON web tokens",
      "An object oriented API helper class to interface with the backend",
      "Carefully planned component heirarchy and state management",
      "A user system with full login, signup, update, and role functionality",
      "Custom hook for storing and retrieving from local storage",
    ],
    backend: [
      "Node-Express REST API backend",
      "Takes values from query string or from JSON body and returns JSON",
      "Middleware authenticates and authorizes each route using JWTs",
      "Extensively tested with Jest unit and integration tests",
      "Lightweight form validation using JSON Schema",
      "Object oriented models for Companies, Users, and Jobs",
      "Hashing with bcrypt ensures passwords are never stored in plain text",
      "Global 404 and generic error handler ensure predictable behavior"
    ],
    database: [
      "AWS RDS Postgres Database",
      "Interfaced with db via PG, a lightweight Postgres driver for Node",
      "Database consists of tables for Company, User, and Job",
      "Developed Job table as a through-table for many-to-many relationship between Company and User",
      "OOP methods dynamically build SQL queries based on search parameters",
      "Implemented parameterized queries to prevent against SQL injection",
    ],
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/jobly-square.png",
    link: "https://jobly-r25.surge.sh/",
  },
  {
    title: "Warbler",
    id: "warbler",
    summary: "Warbler is a fullstack Twitter clone built on Python's Flask web framework. It leverages the ORM, SQLAlchemy to build the interconnected database tables required for a social media application. I developed Warbler while attending Rithm School, a full stack software development bootcamp based here in San Francisco.",
    frontend: [
      "Flask-Jinja Frontend",
      "Server-side-rendered pages using the Jinja II templating engine:",
      "Abstracted repeated code to templates for headers, footers, cards, and more",
      "Used Jinja syntax to implement dynamic behavior and logic inside templates",
      "Designed and implemented a “like” button with dynamic UI that sends an AJAX post request",
      "Utilized the library WTForms to build and validate forms for Messages and User SignUp/Login/Edit",
      "Used WTForms to protect against CSRF attacks and to validate form inputs",
    ],
    backend: [
      "Flask-Python Backend",
      "Implemented user authentication and authorization using the Flask Session object",
      "Followed a Test Driven Development methodology using Python's unittest library",
      "Developed methods to query database and provide metrics for likes, follows, followers",
      "Placed current user in Flask's global object to conveniently check user's admin/login status",
      "Utilized the python-debugger (pdb) to check for exisiting bugs, and troubleshoot the application",
      "Used the ORM SQLALchemy to define object oriented models that interface with the database",
    ],
    database: [
      "AWS RDS Postgres Database",
      "Seeded via a Python script and data from CSV files",
      "Leveraged ORM, SQLAlchemy to interface with database",
      "Database contains tables for Follows, Likes, Users, and Messages",
      "Implemented Follows table as many-to-many relationship between Users",
      "Implemented Likes table as many-to-many relationship between Users and Messages",
      "Stored passwords as bcrypt hashes. Referenced hash during login to avoid hold plain text passwords",
    ],
    img: "https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/warbler-square.png",
    link: "https://r-warble.herokuapp.com/",
  },
];
