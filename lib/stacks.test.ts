import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { beforeAll, describe, expect, it } from "vitest";
import { DagStack } from "./dag-stack";
import { MwaaStack } from "./mwaa-stack";

describe("snapshot tests", () => {
  let mwaaTemplate: Template;
  let dagTemplate: Template;

  beforeAll(() => {
    const app = new App();

    const mwaaStack = new MwaaStack(app, "MwaaStack");
    const dagStack = new DagStack(app, "DagStack", {
      dagFolder: mwaaStack.dagFolder,
      bucket: mwaaStack.bucket,
      roleName: mwaaStack.roleName,
    });

    mwaaTemplate = Template.fromStack(mwaaStack);
    dagTemplate = Template.fromStack(dagStack);
  });

  it("mwaa stack", () => {
    expect(mwaaTemplate).toMatchSnapshot();
  });

  it("dag stack", () => {
    // Remove hashes from snapshot
    const bucketDeployment = dagTemplate.findResources(
      "Custom::CDKBucketDeployment",
    );
    for (const key of Object.keys(bucketDeployment)) {
      bucketDeployment[key].Properties.SourceObjectKeys = ["removed-hash"];
    }
    const lambdaFunctions = dagTemplate.findResources("AWS::Lambda::Function");
    for (const key of Object.keys(lambdaFunctions)) {
      lambdaFunctions[key].Properties.Code.S3Key = "removed-hash";
    }

    expect(dagTemplate).toMatchSnapshot();
  });
});
