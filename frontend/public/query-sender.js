/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function(query) {
    return new Promise(function(fulfill, reject) {
        let url = "/query";
        let xhr  = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-type','application/json');
        xhr.onload = (e) => {
            if (xhr.status === 400 || xhr.status === 200) {
                let responseT = xhr.response;
                let responseData = JSON.parse(responseT);
                return fulfill(responseData);
            } else {
                return reject(xhr.response.status);
            }
        };
        xhr.send(JSON.stringify(query));
    });
};
