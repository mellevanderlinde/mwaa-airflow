import { App, assertions } from "aws-cdk-lib";
import { expect, it } from "vitest";
import { DagStack } from "../lib/dag-stack";
import { MwaaStack } from "../lib/mwaa-stack";

it("should match MwaaStack with snapshot", () => {
  const app = new App();
  const stack = new MwaaStack(app, "TestMwaaStack");
  const template = assertions.Template.fromStack(stack);
  expect(template).toMatchSnapshot();
});

it("should match DagStack with snapshot", () => {
  const app = new App();
  const stack = new DagStack(app, "TestDagStack", {
    bucketName: "test-bucket",
    dagFolder: "test-folder",
    roleName: "test-role",
  });
  const template = assertions.Template.fromStack(stack);

  // Remove hashes from snapshot
  const bucketDeployment = template.findResources(
    "Custom::CDKBucketDeployment",
  );
  for (const key of Object.keys(bucketDeployment)) {
    bucketDeployment[key].Properties.SourceObjectKeys = ["removed-hash"];
  }
  const lambdaFunctions = template.findResources("AWS::Lambda::Function");
  for (const key of Object.keys(lambdaFunctions)) {
    lambdaFunctions[key].Properties.Code.S3Key = "removed-hash";
  }

  expect(template).toMatchSnapshot();
});
