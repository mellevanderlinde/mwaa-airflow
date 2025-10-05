import type { StackProps } from "aws-cdk-lib";
import type { IBucket } from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { Role } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

interface DagStackProps extends StackProps {
  dagFolder: string;
  bucket: IBucket;
  roleName: string;
}

export class DagStack extends Stack {
  constructor(scope: Construct, id: string, props: DagStackProps) {
    super(scope, id, props);

    const logGroup = new LogGroup(this, "LogGroup", {
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const handler = new Function(this, "Lambda", {
      functionName: "mwaa_lambda",
      runtime: Runtime.PYTHON_3_12,
      code: Code.fromAsset("src"),
      handler: "index.handler",
      logGroup,
    });

    new BucketDeployment(this, "BucketDeployment", {
      destinationBucket: props.bucket,
      destinationKeyPrefix: props.dagFolder,
      sources: [Source.asset("dags")],
      include: ["*.py"],
      exclude: ["*"],
      logGroup,
      memoryLimit: 2048,
    });

    handler.grantInvoke(Role.fromRoleName(this, "Role", props.roleName));
  }
}
