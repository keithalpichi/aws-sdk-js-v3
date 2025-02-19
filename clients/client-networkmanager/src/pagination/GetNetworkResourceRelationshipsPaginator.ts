import { Paginator } from "@aws-sdk/types";

import {
  GetNetworkResourceRelationshipsCommand,
  GetNetworkResourceRelationshipsCommandInput,
  GetNetworkResourceRelationshipsCommandOutput,
} from "../commands/GetNetworkResourceRelationshipsCommand";
import { NetworkManager } from "../NetworkManager";
import { NetworkManagerClient } from "../NetworkManagerClient";
import { NetworkManagerPaginationConfiguration } from "./Interfaces";

/**
 * @private
 */
const makePagedClientRequest = async (
  client: NetworkManagerClient,
  input: GetNetworkResourceRelationshipsCommandInput,
  ...args: any
): Promise<GetNetworkResourceRelationshipsCommandOutput> => {
  // @ts-ignore
  return await client.send(new GetNetworkResourceRelationshipsCommand(input), ...args);
};
/**
 * @private
 */
const makePagedRequest = async (
  client: NetworkManager,
  input: GetNetworkResourceRelationshipsCommandInput,
  ...args: any
): Promise<GetNetworkResourceRelationshipsCommandOutput> => {
  // @ts-ignore
  return await client.getNetworkResourceRelationships(input, ...args);
};
export async function* paginateGetNetworkResourceRelationships(
  config: NetworkManagerPaginationConfiguration,
  input: GetNetworkResourceRelationshipsCommandInput,
  ...additionalArguments: any
): Paginator<GetNetworkResourceRelationshipsCommandOutput> {
  // ToDo: replace with actual type instead of typeof input.NextToken
  let token: typeof input.NextToken | undefined = config.startingToken || undefined;
  let hasNext = true;
  let page: GetNetworkResourceRelationshipsCommandOutput;
  while (hasNext) {
    input.NextToken = token;
    input["MaxResults"] = config.pageSize;
    if (config.client instanceof NetworkManager) {
      page = await makePagedRequest(config.client, input, ...additionalArguments);
    } else if (config.client instanceof NetworkManagerClient) {
      page = await makePagedClientRequest(config.client, input, ...additionalArguments);
    } else {
      throw new Error("Invalid client, expected NetworkManager | NetworkManagerClient");
    }
    yield page;
    token = page.NextToken;
    hasNext = !!token;
  }
  // @ts-ignore
  return undefined;
}
