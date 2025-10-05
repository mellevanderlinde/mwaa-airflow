import type { Environment } from "aws-cdk-lib";
import { App } from "aws-cdk-lib";
import { DagStack } from "../lib/dag-stack";
import { MwaaStack } from "../lib/mwaa-stack";

const app = new App();
const env: Environment = { region: "eu-west-1" };

const { dagFolder, bucket, roleName } = new MwaaStack(app, "MwaaStack", { env });
new DagStack(app, "DagStack", { dagFolder, bucket, roleName, env });
