import tcp from "k6/x/tcp";
import { Counter, Trend, Rate } from "k6/metrics";
import { check, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { TextEncoder } from "https://raw.githubusercontent.com/inexorabletash/text-encoding/master/index.js";
globalThis.TextEncoder = TextEncoder;

const tcpFleekFunctionRequests = new Counter("http_reqs");
const tcpFleekFunctionRequestDuration = new Trend("http_req_duration", true);
const tcpFleekFunctionRequestsFailed = new Rate("http_req_failed");

export const options = {
  scenarios: {
    contacts: {
      executor: "ramping-arrival-rate",
      startRate: 2,
      timeUnit: "1s",
      preAllocatedVUs: 3000,
      stages: [
        { target: 2, duration: "30s" },
        { target: 50, duration: "5s" },
        { target: 50, duration: "30s" },
        { target: 100, duration: "10s" },
        { target: 100, duration: "30s" },
        { target: 500, duration: "10s" },
        { target: 500, duration: "1m" },
        { target: 1000, duration: "10s" },
        { target: 1000, duration: "1m" },
        { target: 2000, duration: "10s" },
        { target: 2000, duration: "1m" },
        { target: 3000, duration: "10s" },
        { target: 3000, duration: "1m" },
      ],
    },
  },
};

export default function () {
  // const addr = __ENV.FLEEK_NETWORK_ADDR || "staging.fleek-test.network:4221";
  const addr = __ENV.FLEEK_NETWORK_ADDR || "15.235.119.5:4221";
  const conn = tcp.connect(addr);

  const function_hash =
    __ENV.FLEEK_FUNCTION_HASH ||
    "bafkreicohw7gcxawvk3qfa45qd2j775zy464vam5hw6tn6a7manlkpiagq";
  if (!function_hash) {
    throw new Error("FLEEK_FUNCTION_HASH is required");
  }

  const startTime = Date.now();

  sendHandshake(conn, 1);

  const query = { value: randomString(8) };
  sendRequest(conn, {
    origin: "Ipfs",
    uri: function_hash,
    path: null,
    param: { query },
  });

  const headerRes = readFrame(conn);
  if (headerRes === null) {
    tcpFleekFunctionRequestsFailed.add(1);
    tcp.close(conn);
    return;
  }
  check(headerRes, {
    "verify response header": (res) => res === '{"headers":null,"status":null}',
  });

  const res = readFrame(conn);
  if (headerRes === null) {
    tcpFleekFunctionRequestsFailed.add(1);
    tcp.close(conn);
    return;
  }
  check(res, {
    "verify response body": (res) => res === JSON.stringify(query),
  });

  tcpFleekFunctionRequests.add(1);
  tcpFleekFunctionRequestDuration.add(Date.now() - startTime);

  tcp.close(conn);
}

function sendHandshake(conn, serviceId) {
  const payloadBytes = new Uint8Array(149);
  payloadBytes.set(uint32ToUint8Array(serviceId), 1);
  const lengthBytes = uint32ToUint8Array(payloadBytes.length);
  tcp.write(conn, lengthBytes);
  tcp.write(conn, payloadBytes);
}

function sendRequest(conn, request) {
  const payloadBytes = new Uint8Array([
    0,
    ...new TextEncoder().encode(JSON.stringify(request)),
  ]);
  const lengthBytes = uint32ToUint8Array(payloadBytes.length);
  tcp.write(conn, lengthBytes);
  tcp.write(conn, payloadBytes);
}

// Convert a uint32 to a big-endian Uint8Array.
function uint32ToUint8Array(value) {
  return new Uint8Array([
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ]);
}

function bytesToInt(bytes) {
  return new DataView(new Uint8Array(bytes).buffer).getUint32(0);
}

function readInt(conn) {
  const res = tcpRead(conn, 4);
  if (res.length === 0) {
    return null;
  }
  return bytesToInt(res);
}

function readString(conn, size) {
  const bytes = tcpRead(conn, size);
  if (bytes.length > 0 && bytes[0] == 0) {
    bytes.shift();
  }
  return String.fromCharCode(...bytes);
}

function readFrame(conn) {
  const size = readInt(conn);
  if (size === null) {
    return null;
  }
  return readString(conn, size);
}

function tcpRead(conn, totalBytes, timeout = 5000) {
  let startTime = Date.now();
  let buffer = [];
  let remainingBytes = totalBytes;

  while (remainingBytes > 0 && Date.now() - startTime < timeout) {
    let data = tcp.read(conn, remainingBytes);
    buffer.push(...data);
    remainingBytes -= data.length;
    if (remainingBytes > 0) {
      sleep(0.01);
    }
  }

  return buffer;
}
