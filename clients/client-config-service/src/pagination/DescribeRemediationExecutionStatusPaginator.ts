import { Paginator } from "@aws-sdk/types";

import {
  DescribeRemediationExecutionStatusCommand,
  DescribeRemediationExecutionStatusCommandInput,
  DescribeRemediationExecutionStatusCommandOutput,
} from "../commands/DescribeRemediationExecutionStatusCommand";
import { ConfigService } from "../ConfigService";
import { ConfigServiceClient } from "../ConfigServiceClient";
import { ConfigServicePaginationConfiguration } from "./Interfaces";

/**
 * @private
 */
const makePagedClientRequest = async (
  client: ConfigServiceClient,
  input: DescribeRemediationExecutionStatusCommandInput,
  ...args: any
): Promise<DescribeRemediationExecutionStatusCommandOutput> => {
  // @ts-ignore
  return await client.send(new DescribeRemediationExecutionStatusCommand(input), ...args);
};
/**
 * @private
 */
const makePagedRequest = async (
  client: ConfigService,
  input: DescribeRemediationExecutionStatusCommandInput,
  ...args: any
): Promise<DescribeRemediationExecutionStatusCommandOutput> => {
  // @ts-ignore
  return await client.describeRemediationExecutionStatus(input, ...args);
};
export async function* paginateDescribeRemediationExecutionStatus(
  config: ConfigServicePaginationConfiguration,
  input: DescribeRemediationExecutionStatusCommandInput,
  ...additionalArguments: any
): Paginator<DescribeRemediationExecutionStatusCommandOutput> {
  // ToDo: replace with actual type instead of typeof input.NextToken
  let token: typeof input.NextToken | undefined = config.startingToken || undefined;
  let hasNext = true;
  let page: DescribeRemediationExecutionStatusCommandOutput;
  while (hasNext) {
    input.NextToken = token;
    input["Limit"] = config.pageSize;
    if (config.client instanceof ConfigService) {
      page = await makePagedRequest(config.client, input, ...additionalArguments);
    } else if (config.client instanceof ConfigServiceClient) {
      page = await makePagedClientRequest(config.client, input, ...additionalArguments);
    } else {
      throw new Error("Invalid client, expected ConfigService | ConfigServiceClient");
    }
    yield page;
    token = page.NextToken;
    hasNext = !!token;
  }
  // @ts-ignore
  return undefined;
}
