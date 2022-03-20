import { parseUrl } from "@aws-sdk/url-parser";
import { formatUrl } from "@aws-sdk/util-format-url";
import { createSign } from "crypto";
import { readFileSync } from "fs";

interface PolicyDates {
  dateLessThan: number;
  dateGreaterThan?: number;
}

interface CloudfrontSignInput {
  url: string;
  keyPairId: string;
  privateKey: string;
  dateLessThan: string;
  ipAddress?: string;
  dateGreaterThan?: string;
}

interface SignInput extends Pick<CloudfrontSignInput, "url" | "keyPairId" | "privateKey">, PolicyDates {}

interface SignOutput {
  policy: string;
  signature: string;
}

interface CloudfrontSignedCookiesOutput {
  "CloudFront-Key-Pair-Id": string;
  "CloudFront-Signature": string;
  "CloudFront-Expires"?: number;
  "CloudFront-Policy"?: string;
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

interface BuildPolicyInput extends PolicyDates, Pick<CloudfrontSignInput, "ipAddress"> {
  resource: string;
}

function epochTime(date: Date): number {
  return date.getTime() / 1000;
}

function normalizeBase64(str: string): string {
  return str.replace(/\+/g, "-").replace(/=/g, "_").replace(/\//g, "~");
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
    throw new Error(`IP address "${cidrStr}" is invalid due to ${error.message}.`);
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

function signData(data: string, privateKeyBuffer: Buffer): string {
  const sign = createSign("RSA-SHA1");
  sign.update(data);
  return sign.sign(privateKeyBuffer, "base64");
}

function parseDate(date?: string): number | undefined {
  if (!date) {
    return undefined;
  }
  const parsedDate = new Date(date);
  return parsedDate instanceof Date ? epochTime(parsedDate) : undefined;
}

function parseDateWindow(expiration: string, start?: string): PolicyDates {
  const dateLessThan = parseDate(expiration);
  if (!dateLessThan) {
    throw new Error("dateLessThan is invalid. Ensure a valid date string is provided.");
  }
  return {
    dateLessThan,
    dateGreaterThan: parseDate(start),
  };
}

function sign(args: SignInput): SignOutput {
  const privateKeyBuffer = readFileSync(args.privateKey);
  const policy = JSON.stringify(
    buildPolicy({
      ...args,
      resource: args.url,
    })
  );
  const signature = signData(policy, privateKeyBuffer);
  const normalizedBase64Policy = normalizeBase64(policy);
  const normalizedBase64Signature = normalizeBase64(signature);
  return {
    policy: normalizedBase64Policy,
    signature: normalizedBase64Signature,
  };
}

export function signUrl(args: CloudfrontSignInput): string {
  const { dateLessThan, dateGreaterThan } = parseDateWindow(args.dateLessThan, args.dateGreaterThan);
  const url = parseUrl(args.url);
  const { signature, policy } = sign({
    ...args,
    dateLessThan,
    dateGreaterThan,
  });
  const usingACustomPolicy = Boolean(dateGreaterThan) || Boolean(args.ipAddress);
  return formatUrl({
    ...url,
    query: {
      ...url.query,
      ...(usingACustomPolicy ? { Policy: policy } : {}),
      Expires: String(dateLessThan),
      "Key-Pair-Id": args.keyPairId,
      Signature: signature,
    },
  });
}

export function signCookies(args: CloudfrontSignInput): CloudfrontSignedCookiesOutput {
  const { dateLessThan, dateGreaterThan } = parseDateWindow(args.dateLessThan, args.dateGreaterThan);
  const { signature, policy } = sign({
    ...args,
    dateLessThan,
    dateGreaterThan,
  });
  const usingACustomPolicy = Boolean(dateGreaterThan) || Boolean(args.ipAddress);
  return {
    "CloudFront-Key-Pair-Id": args.keyPairId,
    "CloudFront-Signature": signature,
    "CloudFront-Expires": !usingACustomPolicy ? dateLessThan : undefined,
    "CloudFront-Policy": usingACustomPolicy ? policy : undefined,
  };
}
