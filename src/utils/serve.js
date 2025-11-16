const baseUrl = "/server";

/* Get: Promise form*/
function getData({ url }) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        }
      })
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

/* Post */
function postData({ url, data }) {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

export { baseUrl, fetchData, postData };
