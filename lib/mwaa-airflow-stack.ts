import {
  Stack,
  StackProps,
  RemovalPolicy,
  aws_ec2 as ec2,
  aws_s3 as s3,
  aws_s3_deployment as s3_deployment,
  aws_iam as iam,
  aws_mwaa as mwaa,
  aws_lambda as lambda,
  aws_logs as logs,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class MwaaAirflowStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create MWAA environment
    const environmentName = "airflow";
    const dagsFolderS3 = "dags";
    const vpc = this.createVpc();
    const securityGroup = this.createSecurityGroup(vpc);
    const bucket = this.createBucket();
    const role = this.createRole(environmentName, bucket);
    this.createMwaaEnvironment(
      environmentName,
      bucket,
      dagsFolderS3,
      role,
      securityGroup,
      vpc.privateSubnets,
    );

    // Create DAG resources
    const handler = this.createHandler();
    handler.grantInvoke(role);
    this.copyDag(bucket, dagsFolderS3);
  }

  createVpc(): ec2.Vpc {
    return new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: "Public",
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name: "Private",
        },
      ],
    });
  }

  createSecurityGroup(vpc: ec2.Vpc): ec2.SecurityGroup {
    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(securityGroup, ec2.Port.allTraffic());

    return securityGroup;
  }

  createBucket(): s3.Bucket {
    return new s3.Bucket(this, "Bucket", {
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  createMwaaEnvironment(
    name: string,
    sourceBucket: s3.Bucket,
    dagS3Path: string,
    executionRole: iam.Role,
    securityGroup: ec2.SecurityGroup,
    subnets: ec2.ISubnet[],
  ): mwaa.CfnEnvironment {
    return new mwaa.CfnEnvironment(this, "MwaaEnvironment", {
      name,
      airflowVersion: "2.7.2",
      sourceBucketArn: sourceBucket.bucketArn,
      dagS3Path,
      executionRoleArn: executionRole.roleArn,
      environmentClass: "mw1.small",
      schedulers: 2,
      maxWorkers: 1,
      networkConfiguration: {
        securityGroupIds: [securityGroup.securityGroupId],
        subnetIds: [subnets[0].subnetId, subnets[1].subnetId],
      },
      webserverAccessMode: "PUBLIC_ONLY",
      loggingConfiguration: {
        taskLogs: { enabled: true, logLevel: "INFO" },
      },
    });
  }

  createHandler(): lambda.Function {
    return new lambda.Function(this, "Lambda", {
      functionName: "mwaa_lambda",
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset("src"),
      handler: "lambda.handler",
      logRetention: logs.RetentionDays.ONE_DAY,
    });
  }

  copyDag(
    destinationBucket: s3.Bucket,
    destinationKeyPrefix: string,
  ): s3_deployment.BucketDeployment {
    return new s3_deployment.BucketDeployment(this, "BucketDeployment", {
      destinationBucket,
      destinationKeyPrefix,
      sources: [s3_deployment.Source.asset("dags")],
      include: ["*.py"],
      exclude: ["*"],
    });
  }

  createRole(environmentName: string, bucket: s3.Bucket): iam.Role {
    const role = new iam.Role(this, "Role", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("airflow.amazonaws.com"),
        new iam.ServicePrincipal("airflow-env.amazonaws.com"),
      ),
    });

    bucket.grantRead(role);

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogStream",
          "logs:CreateLogGroup",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:GetLogRecord",
          "logs:GetLogGroupFields",
          "logs:GetQueryResults",
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:airflow-${environmentName}-*`,
        ],
      }),
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "logs:DescribeLogGroups",
          "cloudwatch:PutMetricData",
          "s3:GetAccountPublicAccessBlock",
        ],
        resources: ["*"],
      }),
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["airflow:PublishMetrics"],
        resources: [
          `arn:aws:airflow:${this.region}:${this.account}:environment/${environmentName}`,
        ],
      }),
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "sqs:ChangeMessageVisibility",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ReceiveMessage",
          "sqs:SendMessage",
        ],
        resources: [`arn:aws:sqs:${this.region}:*:airflow-celery-*`],
      }),
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey*",
          "kms:Encrypt",
        ],
        resources: [`arn:aws:kms:*:*:key/*`],
        conditions: {
          StringLike: {
            "kms:ViaService": [`sqs.${this.region}.amazonaws.com`],
          },
        },
      }),
    );

    return role;
  }
}
