<div id="top"></div>
<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]


<!-- PROJECT LOGO -->
<br />
<div align="center">

<h1 align="center">Personal Website</h3>

[![Product Name Screen Shot][product-screenshot]](https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/personal-site-screenshot.png)

  <p align="center">
    My personal portfolio, project library, and blog.
    <br />
    <a href="https://github.com/calebthewood/personalSiteV2"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://www.calebwood.dev/">Visit Site</a>
    ·
    <a href="https://github.com/calebthewood/personalSiteV2/issues">Report Bug</a>
    ·
    <a href="https://github.com/calebthewood/personalSiteV2/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

This repo is home to the ReactJS frontend of my personal website 2.0. I Launched it
towards the end of October 2022. It relies on the backend, a Node-Express REST API I've nicknamed Project Pith, to process content from 3rd party APIs like Notion, and Twitter to provide content for the site. If you're reading this in October or November, the blog section will still be mostly void of content, I hope to add some delightful, informative content that will provide context for my project and protfolio work, if I do it right it'll even be a little entertaining. Thanks for visiting!

Basic diagram of the current site:
<img width="300px" src="https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/simple-site-diagram.png">

<p align="right">(<a href="#top">back to top</a>)</p>



### Built With

* [React.js](https://reactjs.org/)
* [Bootstrap](https://getbootstrap.com)
* [JWT](https://jwt.io/)
* [React-Router](https://reactrouter.com/)
* [Axios](https://axios-http.com/docs/req_config)
* [React-Twitter-Widgets](https://www.npmjs.com/package/react-twitter-widgets)
* [Project Pith](https://github.com/calebthewood/ProjectPith)
  - [Node](https://nodejs.org/en/)
  - [Express](https://expressjs.com/)
  - [MongoDB](https://www.mongodb.com/atlas/database)
  - [NotionHQ SDK](https://github.com/makenotion/notion-sdk-js)
  - [Twitter API V2](https://www.npmjs.com/package/twitter-api-v2)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- Features -->
## Features

The site contains several interesting or unique features.

### Notion API

The Notion integration involves features written in both React and Node. The React API I built handles requesting and parsing a JSON object containing all the data for a blog post. The data comes from my Notion account, so the system is basically packaging a blog post I've written on my desktop Notion app, passing it to the server and database so that the client can request the data and transform it back into JSX. Each blog posts is received by the client as an array of objects. my API parses this array, checking the type of each object in the array. It then passes the object into a corresponding component. For example  paragraph object is passed to a Paragraph component. This allows me to implement features incrementally. Currently, I can post blogs with simple formatting requirements without the need to replciate every feature in Notion. It also allows me to organize and encapsulate the functionality required for each block. As of November, I've added Headings, Paragraphs, Code Blocks, Links, and Images. Next, I would like to add Lists, and improve the formatting.
### Project Library

This section is more for the fun projects. It's also a bit of a ReactJS workshop. Some of the items you'll see here were originally built in React, others I built in vanilla JS, and have converted. I'd like to keep adding to it. It's a lot of fun building out these component/mini-app projects, and displaying them.

- Conway's Game of Life: My GoL implementation I added a powerful set of controls that allows you to run a traditional game, or clear the board and place premade patterns discovered by researchers over the years.

- Productiv: A fun little react themed todo app. Complete with a AJAX powered quote generator. This project was an excellent learning lesson in form control and state management in React.

- Whittle: my first ever, original app. It's a Wordle assist program that shows you a list possible words based on your existing guesses. Getting the UX for this just right was been tougher than I expected. This required me to write some efficient sorting algos to filter the list opf about 8500 5 letter words in the english language.

- Lights Out!: My first practice building a game board in react. It's a fairly simple app that makes for an fairly amusing game. Not that great, but I learned how to hold state and render a game board throughout the course of a game.

- I've a backlog of projects I need to rebuild in react, and I'd love to add some novel stuff here as well.

<!-- ROADMAP -->
## Roadmap

Many of these features were left out of the initial build simply because the site doesn't yet have enough content to warrant great search, tagging, or pagination.

- [ ] Homescreen design
- [ ] Add project menu
    - [ ] search
    - [ ] tags/categories
- [ ] Blog Features
    - [ ] Improve Pagination
    - [ ] Improve Search
    - [ ] Tweet components to avoid embedding
    - [ ] Better Tags
    - [ ] More block types
    - [ ] Comments?

See the [open issues](https://github.com/calebthewood/personalSiteV2/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Caleb Wood - [@calebthewood](https://twitter.com/calebthewood) or calebwood.cs@gmail.com.com

Project Link: [https://github.com/calebthewood/personalSiteV2](https://github.com/calebthewood/personalSiteV2)

Live Site Link: [https://www.calebwood.dev/](https://www.calebwood.dev/)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Font Awesome](https://fontawesome.com/v6/search)
* [Rithm School](https://www.rithmschool.com/)
* [Eloquent JavaScript](https://eloquentjavascript.net/)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/calebthewood/personalSiteV2.svg?style=for-the-badge
[contributors-url]: https://github.com/calebthewood/personalSiteV2/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/calebthewood/personalSiteV2.svg?style=for-the-badge
[forks-url]: https://github.com/calebthewood/personalSiteV2/network/members
[stars-shield]: https://img.shields.io/github/stars/calebthewood/personalSiteV2.svg?style=for-the-badge
[stars-url]: https://github.com/calebthewood/personalSiteV2/stargazers
[issues-shield]: https://img.shields.io/github/issues/calebthewood/personalSiteV2.svg?style=for-the-badge
[issues-url]: https://github.com/calebthewood/personalSiteV2/issues
[license-shield]: https://img.shields.io/github/license/calebthewood/personalSiteV2.svg?style=for-the-badge
[license-url]: https://github.com/calebthewood/personalSiteV2/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/caleb-wood-440b37168
[product-screenshot]: https://s3.us-west-1.amazonaws.com/pix.ly/project-shots/personal-site-screenshot.png
