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

import { CodePipelineClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes } from "../CodePipelineClient";
import { PutApprovalResultInput, PutApprovalResultOutput } from "../models/models_0";
import {
  deserializeAws_json1_1PutApprovalResultCommand,
  serializeAws_json1_1PutApprovalResultCommand,
} from "../protocols/Aws_json1_1";

export interface PutApprovalResultCommandInput extends PutApprovalResultInput {}
export interface PutApprovalResultCommandOutput extends PutApprovalResultOutput, __MetadataBearer {}

/**
 * <p>Provides the response to a manual approval request to AWS CodePipeline. Valid
 *             responses include Approved and Rejected.</p>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { CodePipelineClient, PutApprovalResultCommand } from "@aws-sdk/client-codepipeline"; // ES Modules import
 * // const { CodePipelineClient, PutApprovalResultCommand } = require("@aws-sdk/client-codepipeline"); // CommonJS import
 * const client = new CodePipelineClient(config);
 * const command = new PutApprovalResultCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link PutApprovalResultCommandInput} for command's `input` shape.
 * @see {@link PutApprovalResultCommandOutput} for command's `response` shape.
 * @see {@link CodePipelineClientResolvedConfig | config} for CodePipelineClient's `config` shape.
 *
 */
export class PutApprovalResultCommand extends $Command<
  PutApprovalResultCommandInput,
  PutApprovalResultCommandOutput,
  CodePipelineClientResolvedConfig
> {
  // Start section: command_properties
  // End section: command_properties

  constructor(readonly input: PutApprovalResultCommandInput) {
    // Start section: command_constructor
    super();
    // End section: command_constructor
  }

  /**
   * @internal
   */
  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: CodePipelineClientResolvedConfig,
    options?: __HttpHandlerOptions
  ): Handler<PutApprovalResultCommandInput, PutApprovalResultCommandOutput> {
    this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));

    const stack = clientStack.concat(this.middlewareStack);

    const { logger } = configuration;
    const clientName = "CodePipelineClient";
    const commandName = "PutApprovalResultCommand";
    const handlerExecutionContext: HandlerExecutionContext = {
      logger,
      clientName,
      commandName,
      inputFilterSensitiveLog: PutApprovalResultInput.filterSensitiveLog,
      outputFilterSensitiveLog: PutApprovalResultOutput.filterSensitiveLog,
    };
    const { requestHandler } = configuration;
    return stack.resolve(
      (request: FinalizeHandlerArguments<any>) =>
        requestHandler.handle(request.request as __HttpRequest, options || {}),
      handlerExecutionContext
    );
  }

  private serialize(input: PutApprovalResultCommandInput, context: __SerdeContext): Promise<__HttpRequest> {
    return serializeAws_json1_1PutApprovalResultCommand(input, context);
  }

  private deserialize(output: __HttpResponse, context: __SerdeContext): Promise<PutApprovalResultCommandOutput> {
    return deserializeAws_json1_1PutApprovalResultCommand(output, context);
  }

  // Start section: command_body_extra
  // End section: command_body_extra
}
