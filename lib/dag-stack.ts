import type { StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { Role } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

interface DagStackProps extends StackProps {
  bucketName: string;
  dagFolder: string;
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
      destinationBucket: Bucket.fromBucketName(
        this,
        "Bucket",
        props.bucketName,
      ),
      destinationKeyPrefix: props.dagFolder,
      sources: [Source.asset("dags")],
      include: ["*.py"],
      exclude: ["*"],
      logGroup,
    });

    handler.grantInvoke(Role.fromRoleName(this, "Role", props.roleName));
  }
}
