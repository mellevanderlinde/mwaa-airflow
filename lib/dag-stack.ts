import {
  RemovalPolicy,
  Stack,
  type StackProps,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_s3 as s3,
  aws_s3_deployment as s3_deployment,
} from "aws-cdk-lib";
import type { Construct } from "constructs";

interface DagStackProps extends StackProps {
  bucketName: string;
  dagFolder: string;
  roleName: string;
}

export class DagStack extends Stack {
  constructor(scope: Construct, id: string, props: DagStackProps) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, "LogGroup", {
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const handler = new lambda.Function(this, "Lambda", {
      functionName: "mwaa_lambda",
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset("src"),
      handler: "index.handler",
      logGroup,
    });

    new s3_deployment.BucketDeployment(this, "BucketDeployment", {
      destinationBucket: s3.Bucket.fromBucketName(
        this,
        "Bucket",
        props.bucketName,
      ),
      destinationKeyPrefix: props.dagFolder,
      sources: [s3_deployment.Source.asset("dags")],
      include: ["*.py"],
      exclude: ["*"],
      logGroup,
    });

    handler.grantInvoke(iam.Role.fromRoleName(this, "Role", props.roleName));
  }
}
