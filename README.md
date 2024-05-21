# Fleek Functions Load Testing

Understand the performance and reliability boundaries of fleek functions through [load testing](https://grafana.com/load-testing/).

## Getting started

### Deploy a function

- Upload the function to IPFS: `fleek ipfs add functions/hello.js`
- See the uploaded function content through IPFS: `https://cf-ipfs.com/ipfs/<hash>`
- See the uploaded function content through fleek: `http://staging.fleek-test.network/services/0/ipfs/<hash>`
- Execute the function: `http://staging.fleek-test.network/services/1/ipfs/<hash>`

### Run load test

- Run [k6](https://k6.io/) load test and save HTML report to file:
  ```sh
  REPORT_PATH="reports/ramp-to-150rps-$(date +"%Y-%m-%d_%H-%M-%S").html"
  K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=${REPORT_PATH} k6 run k6/ramp-to-rps.js
  echo "Report saved to ${REPORT_PATH}"
  open "${REPORT_PATH}"
  ```

### Upload report to IPFS for sharing

- Prepend report with `<!doctype html>` so it's rendered by IPFS as HTML
  ```sh
  echo '<!doctype html>' | cat - "${REPORT_PATH}" > temp && mv temp "${REPORT_PATH}"
  ```
- Upload the report to IPFS: `fleek ipfs add "${REPORT_PATH}"`
- See the uploaded function content through IPFS: `https://cf-ipfs.com/ipfs/<hash>`
