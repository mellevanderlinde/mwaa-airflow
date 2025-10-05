import { App } from "aws-cdk-lib";
import { DagStack } from "../lib/dag-stack";
import { MwaaStack } from "../lib/mwaa-stack";

const app = new App();

const { dagFolder, bucket, roleName } = new MwaaStack(app, "MwaaStack");
new DagStack(app, "DagStack", { dagFolder, bucket, roleName });
