import http from "k6/http";
import { sleep, check } from "k6";
import { URL } from "https://jslib.k6.io/url/1.0.0/index.js";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  scenarios: {
    contacts: {
      executor: "ramping-arrival-rate",
      startRate: 50,
      timeUnit: "1s",
      preAllocatedVUs: 600,
      stages: [
        { target: 50, duration: "1m" },
        { target: 100, duration: "10s" },
        { target: 100, duration: "1m" },
        { target: 150, duration: "10s" },
        { target: 150, duration: "1m" },
        { target: 200, duration: "10s" },
        { target: 200, duration: "1m" },
      ],
    },
  },
};

export default function () {
  const host = __ENV.FLEEK_NETWORK_URL || "http://staging.fleek-test.network";
  const hash =
    __ENV.FLEEK_FUNCTION_HASH ||
    "bafkreicohw7gcxawvk3qfa45qd2j775zy464vam5hw6tn6a7manlkpiagq";
  if (!hash) {
    throw new Error("FLEEK_FUNCTION_HASH is required");
  }

  const url = new URL(`${host}/services/1/ipfs/${hash}`);
  url.searchParams.append("value", randomString(8));

  const res = http.get(url.toString());

  check(res, {
    "is status 200": (r) => r.status === 200,
    "verify homepage text": (r) =>
      r.body === JSON.stringify(Object.fromEntries(url.searchParams)),
  });
}
