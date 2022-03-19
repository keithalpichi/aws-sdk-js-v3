import { buildQueryString } from "@aws-sdk/querystring-builder";
import { QueryParameterBag } from "@aws-sdk/types";
import { createSign, createVerify } from "crypto";
import { mkdtempSync, rmdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";

import { signCookies, signUrl } from "./index";

const privateKeyBuffer = Buffer.from(`
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAuHfxvylv0IgfsJkualzZtCqwLyg19Gcsy+jVAAioVtWBOgxE
IYSsED+yzryecDnniJGokXiGTt6nlJk5o95jNSnKw9KOThWey95WudDnEcUWKJow
dlcA1B2iXBx4cmwwdekNxs/hHZjubY+kHuaDc0D/tJYyiN7t84wQA/slRHZ0tDBy
pGI4LeNFn3fmu4dvHcvSYFoa1sV/FDe0P6OHjrkG36XE6gh9+yHEFLAsGzuWZlIH
KmdPx8wuz/73GPnQ/P3+sGjwVjimtzEo5R6VoyMHWHRjenjxN/oFrtizXXuRDsKw
9Vvg8FO3MUsYAEWmKZM3DI9/+niZl/GCjgCIlQIDAQABAoIBAQCX1mKuLrVSuDkd
a3jBI9wuaFTM/BQtMB+3V9a7SGUH1IWh+ia6UDIwzb2oXaksRv1FdF+EHeivUqYt
slG3iH2wbM3xkYaAz1r+A+zu1fzcq5UppoDtZ3/PGPVjTCv4QwVAiKxGUSXC7vaS
SAGXTbY1T/Mp+dduwdCq/0bPgBGU32WzAGtx/JCnKD8brShrcwuGtirDq4c9Pq0T
FOApejyMoYwN0Z6jkErU1qSiEKp/SZrQTO+5BoyjwlZTe8dWjAw4srJ4jH9q1zxm
OZDT+80HnV6FiWqlitqDWQJvPhpW/PMTEmklZZw1WThqRxtm2Xee/KAD5grq+Xho
5xp30A4BAoGBAOXFrkOW65Z8GYzyCjw7XgFkSLA4Dhiwzebxdkv+s2NzHhzGz7pf
Dqe8pQ/bS1B6PLi9v+f8RjP9f1bY3QPxYwfYLwhL/JB4pvLNcGRUQ0fSzWcpmhWH
FN0V6K0kDswC9QL3vbEg9V/MM6EvwNxCPiZB6NQtOqhd48ErZ2cRQKBFAoGBAM2G
aqcWYpyDd06Vc7iVN1QqabpGkDfdk8XC/21ZTOZOQocplv9k+kzSxce8KMZxyQVm
K7D6Atx9uqEdqEutvgdYrJa+Br3VL2oLcBiYPOhuJROyl7Zl8bBeanYAhDraZWbL
tVP/6h9dzowPvcNm6e6SVl+uShqKJb4tv0fftpQRAoGAEXhpWpxEB2oiKzRQEOpW
qHZujG+Gqtvum+uqGfcgvqQHGxsGul316E0Qo9cBr/nLWiSbTdFBqTxSDVFp5J3a
8MLAOLpGVtnFn9p8/DPn9bMSiRCBtbdSn8jFqzx9n4duB668jpY58fG9zzipSlYD
EbebM17JAfo5kftx3kVSi50CgYBPXPd0PA2qOI3ql4WPIneyFYqsNrFcEUEN3cW6
mQA78r536RR43KpW3hEnlr38G1YvsotulKxkLlzR+FzTlGzL82756rk5tsfPYElS
Bf+HFXlVyOISuf0BSQQ9OufUvh7n+gO0Qx9KK3Ql27JAcU4mJPYbjnbpFq2Kaany
fC3JsQKBgANzZbf9D0lgQE1wsb45fzrAPAqRQHeVY7V8sZPQoJFcZ2Ymp/3L/UHc
NwfPmGXHQDQaK9I3XpHfbyOelD6ghHi/wZj0sKR3Uoo84n8sIpCdUvwitjlHlZBE
aoCHJ9c5Pnu6FwMAjP8aaKLQDvoHZKVWL2Ml6A6V3Ed95Itp/g2J
-----END RSA PRIVATE KEY-----`);

function createSignature(data: string): string {
  const signer = createSign("RSA-SHA1");
  signer.update(data);
  return signer.sign(privateKeyBuffer, "base64");
}
function verifySignature(signature: string, data: string): boolean {
  const verifier = createVerify("RSA-SHA1");
  verifier.update(data);
  return verifier.verify(privateKeyBuffer, signature, "base64");
}
function normalizeBase64(str: string): string {
  return str.replace(/\+/g, "-").replace(/=/g, "_").replace(/\//g, "~");
}
function epochTime(date: string): number {
  return new Date(date).getTime() / 1000;
}
function createUrl(url: string, queryParams: QueryParameterBag): string {
  return `${url}?${buildQueryString(queryParams)}`;
}

describe("signUrl", () => {
  let tmpDir = "";
  let privateKeyPath = "";
  beforeAll(() => {
    tmpDir = mkdtempSync(resolve(tmpdir(), "cloudfront-request-signer"));
    privateKeyPath = resolve(tmpDir, "test-private-key.pem");
    writeFileSync(privateKeyPath, privateKeyBuffer);
  });
  afterAll(() => {
    rmdirSync(tmpDir, { recursive: true });
  });
  it("should sign a URL with a canned policy", () => {
    const url = "https://d111111abcdef8.cloudfront.net/private-content/private.jpeg";
    const keyPairId = "APKAEIBAERJR2EXAMPLE";
    const dateLessThan = "2020-01-01";
    const result = signUrl({
      url,
      keyPairId,
      dateLessThan,
      privateKey: privateKeyPath,
    });
    const policyStr = `{"Statement":[{"Resource":"${url}","Condition":{"DateLessThan":{"AWS:EpochTime":${epochTime(
      dateLessThan
    )}}}}]}`;
    const signature = createSignature(policyStr);
    const normalizedBase64Signature = normalizeBase64(signature);
    const expected = createUrl(url, {
      Expires: String(epochTime(dateLessThan)),
      "Key-Pair-Id": keyPairId,
      Signature: normalizedBase64Signature,
    });
    expect(result).toBe(expected);
    expect(verifySignature(signature, policyStr)).toBeTruthy();
  });
  it("should sign a URL with a custom policy", () => {
    const url = "https://d111111abcdef8.cloudfront.net/private-content/private.jpeg";
    const keyPairId = "APKAEIBAERJR2EXAMPLE";
    const dateLessThan = "2020-01-01";
    const dateGreaterThan = "2019-12-01";
    const ipAddress = "10.0.0.0";
    const result = signUrl({
      url,
      keyPairId,
      dateLessThan,
      dateGreaterThan,
      ipAddress,
      privateKey: privateKeyPath,
    });
    const policyStr = JSON.stringify({
      Statement: [
        {
          Resource: url,
          Condition: {
            DateLessThan: {
              "AWS:EpochTime": epochTime(dateLessThan),
            },
            DateGreaterThan: {
              "AWS:EpochTime": epochTime(dateGreaterThan),
            },
            IpAddress: {
              "AWS:SourceIp": `${ipAddress}/32`,
            },
          },
        },
      ],
    });
    const signature = createSignature(policyStr);
    const normalizedBase64Signature = normalizeBase64(signature);
    const expected = createUrl(url, {
      Expires: String(epochTime(dateLessThan)),
      "Key-Pair-Id": keyPairId,
      Signature: normalizedBase64Signature,
    });
    expect(result).toBe(expected);
    expect(verifySignature(signature, policyStr)).toBeTruthy();
  });
});

describe("signCookies", () => {
  let tmpDir = "";
  let privateKeyPath = "";
  beforeAll(() => {
    tmpDir = mkdtempSync(resolve(tmpdir(), "cloudfront-request-signer"));
    privateKeyPath = resolve(tmpDir, "test-private-key.pem");
    writeFileSync(privateKeyPath, privateKeyBuffer);
  });
  afterAll(() => {
    rmdirSync(tmpDir, { recursive: true });
  });
  it("should sign cookies with a canned policy", () => {
    const url = "https://d111111abcdef8.cloudfront.net/private-content/private.jpeg";
    const keyPairId = "APKAEIBAERJR2EXAMPLE";
    const dateLessThan = "2020-01-01";
    const result = signCookies({
      url,
      keyPairId,
      dateLessThan,
      privateKey: privateKeyPath,
    });
    const policyStr = `{"Statement":[{"Resource":"${url}","Condition":{"DateLessThan":{"AWS:EpochTime":${epochTime(
      dateLessThan
    )}}}}]}`;
    const signature = createSignature(policyStr);
    const normalizedBase64Signature = normalizeBase64(signature);
    const expected = {
      "CloudFront-Expires": epochTime(dateLessThan),
      "CloudFront-Key-Pair-Id": keyPairId,
      "CloudFront-Signature": normalizedBase64Signature,
    };
    expect(result["CloudFront-Expires"]).toBe(expected["CloudFront-Expires"]);
    expect(result["CloudFront-Key-Pair-Id"]).toBe(expected["CloudFront-Key-Pair-Id"]);
    expect(result["CloudFront-Signature"]).toBe(expected["CloudFront-Signature"]);
    expect(verifySignature(signature, policyStr)).toBeTruthy();
  });
  it("should sign cookies with a custom policy", () => {
    const url = "https://d111111abcdef8.cloudfront.net/private-content/private.jpeg";
    const keyPairId = "APKAEIBAERJR2EXAMPLE";
    const dateLessThan = "2020-01-01";
    const dateGreaterThan = "2019-12-01";
    const ipAddress = "10.0.0.0";
    const result = signCookies({
      url,
      keyPairId,
      dateLessThan,
      dateGreaterThan,
      ipAddress,
      privateKey: privateKeyPath,
    });
    const policyStr = JSON.stringify({
      Statement: [
        {
          Resource: url,
          Condition: {
            DateLessThan: {
              "AWS:EpochTime": epochTime(dateLessThan),
            },
            DateGreaterThan: {
              "AWS:EpochTime": epochTime(dateGreaterThan),
            },
            IpAddress: {
              "AWS:SourceIp": `${ipAddress}/32`,
            },
          },
        },
      ],
    });
    const signature = createSignature(policyStr);
    const normalizedBase64Signature = normalizeBase64(signature);
    const expected = {
      "CloudFront-Policy": normalizeBase64(policyStr),
      "CloudFront-Key-Pair-Id": keyPairId,
      "CloudFront-Signature": normalizedBase64Signature,
    };
    expect(result["CloudFront-Policy"]).toBe(expected["CloudFront-Policy"]);
    expect(result["CloudFront-Key-Pair-Id"]).toBe(expected["CloudFront-Key-Pair-Id"]);
    expect(result["CloudFront-Signature"]).toBe(expected["CloudFront-Signature"]);
    expect(verifySignature(signature, policyStr)).toBeTruthy();
  });
});
