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

import { MacieClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes } from "../MacieClient";
import { AssociateS3ResourcesRequest, AssociateS3ResourcesResult } from "../models/models_0";
import {
  deserializeAws_json1_1AssociateS3ResourcesCommand,
  serializeAws_json1_1AssociateS3ResourcesCommand,
} from "../protocols/Aws_json1_1";

export interface AssociateS3ResourcesCommandInput extends AssociateS3ResourcesRequest {}
export interface AssociateS3ResourcesCommandOutput extends AssociateS3ResourcesResult, __MetadataBearer {}

/**
 * <p>(Discontinued) Associates specified S3 resources with Amazon Macie Classic for
 *       monitoring and data classification. If <code>memberAccountId</code> isn't specified, the action associates
 *       specified S3 resources with Macie Classic for the current Macie Classic administrator account.
 *       If <code>memberAccountId</code> is specified, the action associates specified S3 resources with Macie
 *       Classic for the specified member account.</p>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { MacieClient, AssociateS3ResourcesCommand } from "@aws-sdk/client-macie"; // ES Modules import
 * // const { MacieClient, AssociateS3ResourcesCommand } = require("@aws-sdk/client-macie"); // CommonJS import
 * const client = new MacieClient(config);
 * const command = new AssociateS3ResourcesCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link AssociateS3ResourcesCommandInput} for command's `input` shape.
 * @see {@link AssociateS3ResourcesCommandOutput} for command's `response` shape.
 * @see {@link MacieClientResolvedConfig | config} for MacieClient's `config` shape.
 *
 */
export class AssociateS3ResourcesCommand extends $Command<
  AssociateS3ResourcesCommandInput,
  AssociateS3ResourcesCommandOutput,
  MacieClientResolvedConfig
> {
  // Start section: command_properties
  // End section: command_properties

  constructor(readonly input: AssociateS3ResourcesCommandInput) {
    // Start section: command_constructor
    super();
    // End section: command_constructor
  }

  /**
   * @internal
   */
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: MacieClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<AssociateS3ResourcesCommandInput, AssociateS3ResourcesCommandOutput> {
    this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));

    const stack = clientStack.concat(this.middlewareStack);

    const { logger } = configuration;
    const clientName = "MacieClient";
    const commandName = "AssociateS3ResourcesCommand";
    const handlerExecutionContext: HandlerExecutionContext = {
      logger,
      clientName,
      commandName,
      inputFilterSensitiveLog: AssociateS3ResourcesRequest.filterSensitiveLog,
      outputFilterSensitiveLog: AssociateS3ResourcesResult.filterSensitiveLog,
    };
    const { requestHandler } = configuration;
    return stack.resolve(
      (request: FinalizeHandlerArguments<any>) =>
        requestHandler.handle(request.request as __HttpRequest, options || {}),
      handlerExecutionContext
    );
  }

  private serialize(input: AssociateS3ResourcesCommandInput, context: __SerdeContext): Promise<__HttpRequest> {
    return serializeAws_json1_1AssociateS3ResourcesCommand(input, context);
  }

  private deserialize(output: __HttpResponse, context: __SerdeContext): Promise<AssociateS3ResourcesCommandOutput> {
    return deserializeAws_json1_1AssociateS3ResourcesCommand(output, context);
  }

  // Start section: command_body_extra
  // End section: command_body_extra
}
