import { getSerdePlugin } from "@aws-sdk/middleware-serde";
import { HttpRequest as __HttpRequest, HttpResponse as __HttpResponse } from "@aws-sdk/protocol-http";
import { Command as $Command } from "@aws-sdk/smithy-client";
import {
  FinalizeHandlerArguments,
  Handler,
  HandlerExecutionContext,
  HttpHandlerOptions as __HttpHandlerOptions,
  MetadataBearer as __MetadataBearer,
  MiddlewareStack,
  SerdeContext as __SerdeContext,
} from "@aws-sdk/types";

import { ListOrdersInput, ListOrdersOutput } from "../models/models_0";
import { OutpostsClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes } from "../OutpostsClient";
import {
  deserializeAws_restJson1ListOrdersCommand,
  serializeAws_restJson1ListOrdersCommand,
} from "../protocols/Aws_restJson1";

export interface ListOrdersCommandInput extends ListOrdersInput {}
export interface ListOrdersCommandOutput extends ListOrdersOutput, __MetadataBearer {}

/**
 * <p>Create a list of the Outpost orders for your Amazon Web Services account. You can filter your request by Outpost to
 *       return a more specific list of results. </p>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { OutpostsClient, ListOrdersCommand } from "@aws-sdk/client-outposts"; // ES Modules import
 * // const { OutpostsClient, ListOrdersCommand } = require("@aws-sdk/client-outposts"); // CommonJS import
 * const client = new OutpostsClient(config);
 * const command = new ListOrdersCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link ListOrdersCommandInput} for command's `input` shape.
 * @see {@link ListOrdersCommandOutput} for command's `response` shape.
 * @see {@link OutpostsClientResolvedConfig | config} for OutpostsClient's `config` shape.
 *
 */
export class ListOrdersCommand extends $Command<
  ListOrdersCommandInput,
  ListOrdersCommandOutput,
  OutpostsClientResolvedConfig
> {
  // Start section: command_properties
  // End section: command_properties

  constructor(readonly input: ListOrdersCommandInput) {
    // Start section: command_constructor
    super();
    // End section: command_constructor
  }

  /**
   * @internal
   */
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: OutpostsClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<ListOrdersCommandInput, ListOrdersCommandOutput> {
    this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));

    const stack = clientStack.concat(this.middlewareStack);

    const { logger } = configuration;
    const clientName = "OutpostsClient";
    const commandName = "ListOrdersCommand";
    const handlerExecutionContext: HandlerExecutionContext = {
      logger,
      clientName,
      commandName,
      inputFilterSensitiveLog: ListOrdersInput.filterSensitiveLog,
      outputFilterSensitiveLog: ListOrdersOutput.filterSensitiveLog,
    };
    const { requestHandler } = configuration;
    return stack.resolve(
      (request: FinalizeHandlerArguments<any>) =>
        requestHandler.handle(request.request as __HttpRequest, options || {}),
      handlerExecutionContext
    );
  }

  private serialize(input: ListOrdersCommandInput, context: __SerdeContext): Promise<__HttpRequest> {
    return serializeAws_restJson1ListOrdersCommand(input, context);
  }

  private deserialize(output: __HttpResponse, context: __SerdeContext): Promise<ListOrdersCommandOutput> {
    return deserializeAws_restJson1ListOrdersCommand(output, context);
  }

  // Start section: command_body_extra
  // End section: command_body_extra
}
