import http from "k6/http";
import { sleep, check } from "k6";
import { URL } from "https://jslib.k6.io/url/1.0.0/index.js";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  // noConnectionReuse: true, // disable keep-alive connections
  scenarios: {
    contacts: {
      executor: "ramping-vus",
      startVUs: 8,
      gracefulRampDown: "0s",
      stages: [
        { target: 8, duration: "30s" },
        { target: 16, duration: "5s" },
        { target: 16, duration: "30s" },
        { target: 32, duration: "5s" },
        { target: 32, duration: "30s" },
        { target: 64, duration: "5s" },
        { target: 64, duration: "30s" },
        { target: 128, duration: "5s" },
        { target: 128, duration: "30s" },
        { target: 256, duration: "5s" },
        { target: 256, duration: "30s" },
        { target: 512, duration: "10s" },
        { target: 512, duration: "1m" },
        { target: 1024, duration: "10s" },
        { target: 1024, duration: "1m" },
      ],
    },
  },
};

export default function () {
  // const host = __ENV.FLEEK_NETWORK_URL || "http://staging.fleek-test.network";
  const host = __ENV.FLEEK_NETWORK_URL || "http://15.235.119.5";
  const function_hash =
    __ENV.FLEEK_FUNCTION_HASH ||
    "bafkreicohw7gcxawvk3qfa45qd2j775zy464vam5hw6tn6a7manlkpiagq";
  if (!function_hash) {
    throw new Error("FLEEK_FUNCTION_HASH is required");
  }

  const url = new URL(`${host}/services/1/ipfs/${function_hash}`);
  url.searchParams.append("value", randomString(8));

  const res = http.get(url.toString());

  check(res, {
    "is status 200": (r) => r.status === 200,
    "verify response body": (res) =>
      res.body === JSON.stringify(Object.fromEntries(url.searchParams)),
  });
}
