import { parseUrl } from "@aws-sdk/url-parser";
import { createSign } from "crypto";

/** Input type to getSignedUrl and getSignedCookies */
export type CloudfrontSignInput = CloudfrontSignInputWithParameters | CloudfrontSignInputWithPolicy;

export interface CloudfrontSignInputBase {
  /** The URL string to sign */
  url: string;
  /** The ID of the Cloudfront key pair */
  keyPairId: string;
  /** The content of the Cloudfront private key */
  privateKey: string | Buffer;
  /** The date string for when the signed URL or cookie can no longer be accessed */
  dateLessThan?: string;
  /** The IP address string to restrict signed URL access to */
  ipAddress?: string;
  /** The date string for when the signed URL or cookie can start to be accessed */
  dateGreaterThan?: string;
}

export type CloudfrontSignInputWithParameters = CloudfrontSignInputBase & {
  /** The date string for when the signed URL or cookie can no longer be accessed */
  dateLessThan: string;
  /** The JSON-encoded policy string. For this type policy should not be provided. */
  policy?: never;
};

export type CloudfrontSignInputWithPolicy = CloudfrontSignInputBase & {
  /** The JSON-encoded policy string */
  policy: string;
  /**
   * The date string for when the signed URL or cookie can no longer be accessed.
   * For this type dateLessThan should not be provided.
   */
  dateLessThan?: never;
  /** The IP address string to restrict signed URL access to
   * For this type ipAddress should not be provided.
   */
  ipAddress?: string;
  /** The date string for when the signed URL or cookie can start to be accessed
   * For this type dateGreaterThan should not be provided.
   */
  dateGreaterThan?: never;
};

export interface CloudfrontSignedCookiesOutput {
  /** ID of the Cloudfront key pair */
  "CloudFront-Key-Pair-Id": string;
  /** Hashed, signed, and base64-encoded version of the JSON policy */
  "CloudFront-Signature": string;
  /** The unix date time for when the signed URL or cookie can no longer be accessed */
  "CloudFront-Expires"?: number;
  /** Base64-encoded version of the JSON policy */
  "CloudFront-Policy"?: string;
}
/**
 * Creates a signed URL string using a canned or custom policy.
 * @param  {CloudfrontSignInput} options
 * @param  {string} options.dateLessThan
 * @param  {string} options.dateGreaterThan
 * @param  {string} options.url
 * @param  {string} options.keyPairId
 * @param  {string|Buffer} options.privateKey
 * @param  {string} options.ipAddress
 * @param  {string} options.policy
 * @returns string
 */
export function getSignedUrl({
  dateLessThan,
  dateGreaterThan,
  url,
  keyPairId,
  privateKey,
  ipAddress,
  policy,
}: CloudfrontSignInput): string {
  const resource = getResource(url);
  const parsedUrl = parseUrl(url);
  const queryParams: string[] = [];
  for (const key in parsedUrl.query) {
    queryParams.push(`${key}=${parsedUrl.query[key]}`);
  }
  const shouldCreateCustomPolicy = Boolean(dateGreaterThan) || Boolean(ipAddress);
  const cloudfrontQueryParams = policy
    ? signWithProvidedPolicy({ keyPairId, privateKey, policy })
    : shouldCreateCustomPolicy
    ? signWithCustomPolicy({ keyPairId, privateKey, resource, dateLessThan, dateGreaterThan, ipAddress })
    : signWithCannedPolicy({ keyPairId, privateKey, resource, dateLessThan });
  for (const key in cloudfrontQueryParams) {
    queryParams.push(`${key}=${cloudfrontQueryParams[key]}`);
  }
  const urlWithNewQueryParams = `${url.split("?")[0]}?${queryParams.join("&")}`;
  if (determineScheme(url) === "rtmp") {
    return getRtmpUrl(urlWithNewQueryParams);
  }
  return urlWithNewQueryParams;
}

/**
 * Creates signed cookies using a canned or custom policy.
 * @param  {CloudfrontSignInput} options
 * @param  {string} options.dateLessThan
 * @param  {string} options.dateGreaterThan
 * @param  {string} options.url
 * @param  {string} options.keyPairId
 * @param  {string|Buffer} options.privateKey
 * @param  {string} options.ipAddress
 * @param  {string} options.policy
 * @returns CloudfrontSignedCookiesOutput
 */
export function getSignedCookies({
  ipAddress,
  url,
  privateKey,
  keyPairId,
  dateLessThan,
  dateGreaterThan,
  policy,
}: CloudfrontSignInput): CloudfrontSignedCookiesOutput {
  const resource = getResource(url);
  const shouldCreateCustomPolicy = Boolean(dateGreaterThan) || Boolean(ipAddress);
  const cloudfrontCookieAttributes = policy
    ? signWithProvidedPolicy({ keyPairId, privateKey, policy })
    : shouldCreateCustomPolicy
    ? signWithCustomPolicy({ keyPairId, privateKey, resource, dateLessThan, dateGreaterThan, ipAddress })
    : signWithCannedPolicy({ keyPairId, privateKey, resource, dateLessThan });
  return {
    "CloudFront-Key-Pair-Id": cloudfrontCookieAttributes["Key-Pair-Id"],
    "CloudFront-Signature": cloudfrontCookieAttributes.Signature,
    "CloudFront-Expires": cloudfrontCookieAttributes.Expires,
    "CloudFront-Policy": cloudfrontCookieAttributes.Policy,
  };
}

interface Policy {
  Statement: Array<{
    Resource: string;
    Condition: {
      DateLessThan: {
        "AWS:EpochTime": number;
      };
      IpAddress?: {
        "AWS:SourceIp": string;
      };
      DateGreaterThan?: {
        "AWS:EpochTime": number;
      };
    };
  }>;
}

interface PolicyDates {
  dateLessThan: number;
  dateGreaterThan?: number;
}

interface BuildPolicyInput extends PolicyDates, Pick<CloudfrontSignInput, "ipAddress"> {
  resource: string;
}

interface SignedURLAttributes {
  Expires?: number;
  Policy?: string;
  "Key-Pair-Id": string;
  Signature: string;
}

function epochTime(date: Date): number {
  return Math.round(date.getTime() / 1000);
}

function encodeToBase64(str: string): string {
  return normalizeBase64(Buffer.from(str).toString("base64"));
}

function normalizeBase64(str: string): string {
  const replacements = {
    "+": "-",
    "=": "_",
    "/": "~",
  } as Record<string, string>;
  return str.replace(/[+=/]/g, function (match) {
    return replacements[match];
  });
}

function validateIP(ipStr: string): void {
  const octets = ipStr.split(".");
  if (octets.length !== 4) {
    throw new Error(`IP does not contain four octets.`);
  }
  const isValid = octets.every((octet: string) => {
    const num = Number(octet);
    return Number.isInteger(num) && num >= 0 && num <= 255;
  });
  if (!isValid) {
    throw new Error("invalid IP octets");
  }
}

function validateMask(maskStr: string): void {
  const mask = Number(maskStr);
  const isValid = Number.isInteger(mask) && mask >= 0 && mask <= 32;
  if (!isValid) {
    throw new Error("invalid mask");
  }
}

function parseCIDR(cidrStr: string): string {
  try {
    const cidrParts = cidrStr.split("/");
    if (cidrParts.some((part: string) => part.length === 0)) {
      throw new Error("missing ip or mask part of CIDR");
    }
    validateIP(cidrParts[0]);
    let mask = "32";
    if (cidrParts.length === 2) {
      validateMask(cidrParts[1]);
      mask = cidrParts[1];
    }
    return `${cidrParts[0]}/${mask}`;
  } catch (error) {
    const errMessage = `IP address "${cidrStr}" is invalid`;
    if (error instanceof Error) {
      throw new Error(`${errMessage} due to ${error.message}.`);
    } else {
      throw new Error(`${errMessage}.`);
    }
  }
}

function buildPolicy(args: BuildPolicyInput): Policy {
  const policy: Policy = {
    Statement: [
      {
        Resource: args.resource,
        Condition: {
          DateLessThan: {
            "AWS:EpochTime": args.dateLessThan,
          },
        },
      },
    ],
  };
  if (args.dateGreaterThan) {
    policy.Statement[0].Condition["DateGreaterThan"] = {
      "AWS:EpochTime": args.dateGreaterThan,
    };
  }
  if (args.ipAddress) {
    const cidr = parseCIDR(args.ipAddress);
    policy.Statement[0].Condition["IpAddress"] = {
      "AWS:SourceIp": cidr,
    };
  }
  return policy;
}

function signData(data: string, privateKey: string | Buffer): string {
  const sign = createSign("RSA-SHA1");
  sign.update(data);
  return sign.sign(privateKey, "base64");
}

function parseDate(date?: string): number | undefined {
  if (!date) {
    return undefined;
  }
  const parsedDate = Date.parse(date);
  return isNaN(parsedDate) ? undefined : epochTime(new Date(parsedDate));
}

function parseDateWindow(expiration: string, start?: string): PolicyDates {
  const dateLessThan = parseDate(expiration);
  if (!dateLessThan) {
    throw new Error("dateLessThan is invalid. Ensure the date string is compatible with the Date constructor.");
  }
  return {
    dateLessThan,
    dateGreaterThan: parseDate(start),
  };
}

function signPolicy(policy: string, privateKey: string | Buffer): string {
  return normalizeBase64(signData(policy, privateKey));
}

function determineScheme(url: string) {
  const parts = url.split("://");
  if (parts.length < 2) {
    throw new Error("Invalid URL.");
  }

  return parts[0].replace("*", "");
}

function getRtmpUrl(rtmpUrl: string) {
  const parsed = new URL(rtmpUrl);
  return parsed.pathname.replace(/^\//, "") + parsed.search + parsed.hash;
}

function getResource(url: string): string {
  switch (determineScheme(url)) {
    case "http":
    case "https":
      return url;
    case "rtmp":
      return getRtmpUrl(url);
    default:
      throw new Error("Invalid URI scheme. Scheme must be one of http, https, or rtmp");
  }
}

function signWithCannedPolicy({
  keyPairId,
  privateKey,
  resource,
  dateLessThan,
}: {
  keyPairId: string;
  privateKey: string | Buffer;
  resource: string;
  dateLessThan: string;
}): SignedURLAttributes {
  const parsedDates = parseDateWindow(dateLessThan);
  const policy = JSON.stringify(
    buildPolicy({
      resource,
      dateLessThan: parsedDates.dateLessThan,
    })
  );
  const signature = signPolicy(policy, privateKey);
  return {
    Expires: parsedDates.dateLessThan,
    "Key-Pair-Id": keyPairId,
    Signature: signature,
  };
}

function signWithProvidedPolicy({
  keyPairId,
  privateKey,
  policy,
}: {
  keyPairId: string;
  privateKey: string | Buffer;
  policy: string;
}): SignedURLAttributes {
  const signature = signPolicy(policy, privateKey);
  return {
    Policy: encodeToBase64(policy),
    "Key-Pair-Id": keyPairId,
    Signature: signature,
  };
}

function signWithCustomPolicy({
  resource,
  keyPairId,
  privateKey,
  dateLessThan,
  dateGreaterThan,
  ipAddress,
}: {
  resource: string;
  keyPairId: string;
  privateKey: string | Buffer;
  dateLessThan: string;
  dateGreaterThan?: string;
  ipAddress?: string;
}): SignedURLAttributes {
  const parsedDates = parseDateWindow(dateLessThan, dateGreaterThan);
  const policy = JSON.stringify(
    buildPolicy({
      resource,
      dateLessThan: parsedDates.dateLessThan,
      dateGreaterThan: parsedDates.dateGreaterThan,
      ipAddress,
    })
  );
  return signWithProvidedPolicy({
    keyPairId,
    privateKey,
    policy,
  });
}
