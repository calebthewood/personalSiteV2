import axios from "axios";

/**
 * Much of this will be moved to server! But for now, I have two metric data types
 *
 *  - route objects track the number of visits for each route
 *  - sessions object tracks the uuid of the user and the pages they went to
 *
 * route = {
 *  _id: string,
 *  route: string,
 *  lastVisited: "yyyy-mm-dd",
 *  visits: number
 * }
 *
 * sessions = {
 *  _id: string,
 *  created: "yyyy-mm-dd",
 *  sessions: string[],
 *  uuid: string
 * }
 * me eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXNzZXJie…xODR9.OsyQowCX6AOoDS45huDwM0a0gaTDUA8JYVGRDrF7jjE
 */
export class DashboardAPI {

  static async fetchMetricData() {
    let response;
    try {
      response = await axios.get("https://project-pith.herokuapp.com/metrics");
    } catch (e) {
      console.error("Error: Fetching Metric Data");
    }
    return response;
  }

  static rankPages(data) {
    return data.filter(doc => "visits" in doc).sort(
      (a, b) => b.visits - a.visits);
  }

  // makes a pie chart for visitations to about, portfolio, project, blog
  static generateRouteChart(data) {
    //create freq counter that resembles this
    const results = [
      { name: "home", count: 0, color: "#686de0" },
      { name: "about", count: 0, color: "#f6e58d" },
      { name: "portfolio", count: 0, color: "#ff7979" },
      { name: "projects", count: 0, color: "#badc58" },
      { name: "blog", count: 0, color: "#7ed6df" },
    ];

    for (let document of data) {
      if ('route' in document) {
        let route = document.route.split("/");

        if (route[1] === '') {
          results[0].count += 1; // home is root route
        } else if (route[1] === 'about') {
          results[1].count += 1;
        } else if (route[1] === 'portfolio') {
          results[2].count += 1;
        } else if (route[1] === 'projects') {
          results[3].count += 1;
        } else if (route[1] === 'blog') {
          results[4].count += 1;
        }
      }
    }

    return results;
  }

  static uniqueVisitorCount(response) {
    // counts unique visitors
    console.log('uniqueVisitorCount', response);
    let visitorCount = new Set([]);
    for (let document of response) {
      if ('uuid' in document) {
        visitorCount.add(document.uuid);
      }
    }
    return visitorCount.size;
  }

  /** Gets the dates for the earliest and the most recent visits to the site
   * @param {object} response - the response data from /metrics route
   */
  static getFirstLast(response) {
    let first = new Date('2023-04-28');
    let last = new Date('2023-04-28');
    let temp;

    for (let record of response) {
      if (record.hasOwnProperty('created')) {
        temp = new Date(record.created);
        first = first < temp ? first : temp;
        last = last > temp ? last : temp;
      }
    }
    return { first, last };
  }

  static getPaths(data) {
    const paths = [];
    for (let record of data) {
      // excludes most of my own visits
      if ('sessions' in record && record.uuid !== "ab45196a-a6df-41c4-802c-fd89bd541e87") {
        let { date, pages } = record.sessions
          let path = [];
          for (let page of pages) {
            let pageArr = page.split('/');
            let len = pageArr.length;
            let last = pageArr[len - 1];
            if (len === 2 && last === '') {
              path.push('home');
            } else {
              path.push(pageArr[len - 1]);
            }
          }
          paths.push({
            date: date,
            path: path.join(' > ')
          });
      }
    }
    // would be neat to roll my own sort, but this is... so easy.
    paths.sort((a, b) => new Date(b.date) - new Date(a.date));
    return paths;
  }
}
