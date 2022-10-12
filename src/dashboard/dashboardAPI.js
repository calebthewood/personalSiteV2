import axios from "axios";

export default class DashboardAPI {

  static async fetchMetricData() {
    let response;
    try {
      response = await axios.get("http://localhost:3001/metrics");
    } catch (e) {
      console.error("Error: Fetching Metric Data");
    }
    return response;
  }

  static rankPages(data) {
    return data.filter(doc => "visits" in doc).sort(
      (a,b) => b.visits - a.visits)
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

  static uniqueVisitorCount(data) {
    // counts unique visitors
    let visitorCount = new Set([]);
    for (let document of data) {
      if ('uuid' in document) {
        visitorCount.add(document.uuid);
      }
    }
    return visitorCount.size;
  }


}
