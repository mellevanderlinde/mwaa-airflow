import type { StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { CompositePrincipal, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { CfnEnvironment } from "aws-cdk-lib/aws-mwaa";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";

export class MwaaStack extends Stack {
  public readonly bucketName: string;
  public readonly dagFolder: string;
  public readonly roleName: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const environmentName = "airflow";
    this.dagFolder = "dags";

    const bucket = new Bucket(this, "Bucket", {
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const role = this.createRole(environmentName, bucket);

    const logGroup = new LogGroup(this, "LogGroup", {
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const vpc = new Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          subnetType: SubnetType.PUBLIC,
          name: "Public",
        },
        {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          name: "Private",
        },
      ],
    });

    const securityGroup = new SecurityGroup(this, "SecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(securityGroup, Port.allTraffic());

    new CfnEnvironment(this, "MwaaEnvironment", {
      name: environmentName,
      airflowVersion: "2.10.1",
      sourceBucketArn: bucket.bucketArn,
      dagS3Path: this.dagFolder,
      executionRoleArn: role.roleArn,
      environmentClass: "mw1.small",
      schedulers: 2,
      maxWorkers: 1,
      networkConfiguration: {
        securityGroupIds: [securityGroup.securityGroupId],
        subnetIds: [
          vpc.privateSubnets[0].subnetId,
          vpc.privateSubnets[1].subnetId,
        ],
      },
      webserverAccessMode: "PUBLIC_ONLY",
      loggingConfiguration: {
        taskLogs: {
          cloudWatchLogGroupArn: logGroup.logGroupArn,
          enabled: true,
          logLevel: "INFO",
        },
      },
    });

    this.bucketName = bucket.bucketName;
    this.roleName = role.roleName;
  }

  createRole(environmentName: string, bucket: Bucket): Role {
    const role = new Role(this, "Role", {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("airflow.amazonaws.com"),
        new ServicePrincipal("airflow-env.amazonaws.com"),
      ),
    });

    bucket.grantRead(role);

    role.addToPolicy(
      new PolicyStatement({
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
      new PolicyStatement({
        actions: [
          "logs:DescribeLogGroups",
          "cloudwatch:PutMetricData",
          "s3:GetAccountPublicAccessBlock",
        ],
        resources: ["*"],
      }),
    );

    role.addToPolicy(
      new PolicyStatement({
        actions: ["airflow:PublishMetrics"],
        resources: [
          `arn:aws:airflow:${this.region}:${this.account}:environment/${environmentName}`,
        ],
      }),
    );

    role.addToPolicy(
      new PolicyStatement({
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
      new PolicyStatement({
        actions: [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey*",
          "kms:Encrypt",
        ],
        resources: ["arn:aws:kms:*:*:key/*"],
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
