import {
  Stack,
  StackProps,
  RemovalPolicy,
  aws_s3 as s3,
  aws_s3_deployment as s3_deployment,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_iam as iam,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface DagStackProps extends StackProps {
  bucketName: string;
  dagFolder: string;
  roleName: string;
}

export class DagStack extends Stack {
  constructor(scope: Construct, id: string, props: DagStackProps) {
    super(scope, id, props);

    const logGroup = this.createLogGroup();
    const handler = this.createHandler(logGroup);
    this.copyDag(props.bucketName, props.dagFolder, logGroup);
    handler.grantInvoke(iam.Role.fromRoleName(this, "Role", props.roleName));
  }

  createLogGroup(): logs.LogGroup {
    return new logs.LogGroup(this, "LogGroup", {
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  createHandler(logGroup: logs.LogGroup): lambda.Function {
    return new lambda.Function(this, "Lambda", {
      functionName: "mwaa_lambda",
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset("src"),
      handler: "index.handler",
      logGroup,
    });
  }

  copyDag(
    bucketName: string,
    dagFolder: string,
    logGroup: logs.LogGroup,
  ): s3_deployment.BucketDeployment {
    return new s3_deployment.BucketDeployment(this, "BucketDeployment", {
      destinationBucket: s3.Bucket.fromBucketName(this, "Bucket", bucketName),
      destinationKeyPrefix: dagFolder,
      sources: [s3_deployment.Source.asset("dags")],
      include: ["*.py"],
      exclude: ["*"],
      logGroup,
    });
  }
}
